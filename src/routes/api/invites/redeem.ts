import { createFileRoute } from "@tanstack/react-router";
import { createRateLimiter } from "@/api/rate-limit";
import {
  forbiddenError,
  getClientAddress,
  internalServerError,
  notFoundError,
  parseJsonBody,
  requireSameOrigin,
  tooManyRequestsError,
  unauthorizedError,
} from "@/api/route-utils";
import { inviteRedeemSchema } from "@/api/validation";
import { auth } from "@/auth/better-auth";
import { ROLES } from "@/auth/roles";
import { getUserByEmail } from "@/auth/session.server";
import { db } from "@/db/client";
import {
  consumeInvite,
  getActiveInviteByToken,
  linkUserToClient,
  updateUserRole,
} from "@/db/records";
import { serializeInvitePreview } from "@/lib/invite-preview";

const invitePreviewRateLimiter = createRateLimiter({
  maxAttempts: 20,
  windowMs: 60 * 1000,
});

const inviteSignInRateLimiter = createRateLimiter({
  maxAttempts: 5,
  windowMs: 10 * 60 * 1000,
});

interface AuthApiResult {
  headers: Headers;
  response: unknown;
  status: number;
}

interface InviteRedeemPayload {
  email: string;
  name: string;
  password: string;
  token: string;
}

function jsonWithHeaders(body: unknown, status: number, headers: Headers) {
  return new Response(JSON.stringify(body), {
    headers,
    status,
  });
}

function isSuccessfulAuthResult(result: AuthApiResult) {
  return result.status >= 200 && result.status < 300;
}

async function authenticateExistingInviteUser(
  request: Request,
  payload: InviteRedeemPayload,
  token: string
) {
  const rateLimitKey = [
    "invite-redeem",
    getClientAddress(request),
    payload.email.toLowerCase(),
    token,
  ].join(":");
  const rateLimit = inviteSignInRateLimiter.check(rateLimitKey);

  if (!rateLimit.ok) {
    return {
      error: tooManyRequestsError(
        "Too many invite sign-in attempts. Please try again later.",
        rateLimit.retryAfterSeconds
      ),
      ok: false as const,
    };
  }

  try {
    const authResult = (await auth.api.signInEmail({
      body: {
        callbackURL: "/portal",
        email: payload.email,
        password: payload.password,
      },
      headers: request.headers,
      returnHeaders: true,
      returnStatus: true,
    })) as AuthApiResult;

    if (isSuccessfulAuthResult(authResult)) {
      inviteSignInRateLimiter.reset(rateLimitKey);
    }

    return {
      authResult,
      ok: true as const,
    };
  } catch (error) {
    console.error("invite redeem sign-up failed", error);
    return {
      error: unauthorizedError("We could not complete invite sign-in."),
      ok: false as const,
    };
  }
}

async function authenticateNewInviteUser(
  request: Request,
  payload: InviteRedeemPayload
) {
  try {
    const authResult = (await auth.api.signUpEmail({
      body: {
        callbackURL: "/portal",
        email: payload.email,
        name: payload.name,
        password: payload.password,
      },
      headers: request.headers,
      returnHeaders: true,
      returnStatus: true,
    })) as AuthApiResult;

    return {
      authResult,
      ok: true as const,
    };
  } catch (error) {
    console.error("invite redeem sign-in failed", error);
    return {
      error: unauthorizedError("We could not complete invite sign-in."),
      ok: false as const,
    };
  }
}

async function authenticateInviteRedeem(
  request: Request,
  payload: InviteRedeemPayload,
  hasExistingUser: boolean
) {
  const authAttempt = hasExistingUser
    ? await authenticateExistingInviteUser(request, payload, payload.token)
    : await authenticateNewInviteUser(request, payload);

  if (!authAttempt.ok) {
    return authAttempt;
  }

  if (!isSuccessfulAuthResult(authAttempt.authResult)) {
    return {
      error: unauthorizedError("We could not complete invite sign-in."),
      ok: false as const,
    };
  }

  return authAttempt;
}

async function syncInviteRedeemUser(
  request: Request,
  token: string,
  clientId: string,
  userId: string
) {
  try {
    const didConsumeInvite = await db.transaction(async (tx) => {
      const consumed = await consumeInvite(token, tx);

      if (!consumed) {
        return false;
      }

      await updateUserRole(userId, ROLES.CLIENT, tx);
      await linkUserToClient(clientId, userId, tx);

      return true;
    });

    if (!didConsumeInvite) {
      return {
        error: forbiddenError("This invite is invalid or has expired."),
        ok: false as const,
      };
    }

    return { ok: true as const };
  } catch (error) {
    console.error("invite redeem post-auth sync failed", error);
    const signOutHeaders = await signOutAfterSetupFailure(request);
    const response = internalServerError(
      "Account setup failed, please try again."
    );

    if (signOutHeaders) {
      for (const [key, value] of signOutHeaders.entries()) {
        response.headers.set(key, value);
      }
    }

    return {
      error: response,
      ok: false as const,
    };
  }
}

async function signOutAfterSetupFailure(request: Request) {
  try {
    const result = (await auth.api.signOut({
      headers: request.headers,
      returnHeaders: true,
      returnStatus: true,
    })) as AuthApiResult;

    return result.headers;
  } catch (error) {
    console.error("invite redeem session cleanup failed", error);
    return null;
  }
}

export const Route = createFileRoute("/api/invites/redeem")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const previewRateLimit = invitePreviewRateLimiter.check(
          `invite-preview:${getClientAddress(request)}`
        );

        if (!previewRateLimit.ok) {
          return tooManyRequestsError(
            "Too many requests. Please try again later.",
            previewRateLimit.retryAfterSeconds
          );
        }

        const url = new URL(request.url);
        const token = url.searchParams.get("token");

        if (!token) {
          return notFoundError("Invite token is required.");
        }

        const invite = await getActiveInviteByToken(token);

        if (!invite) {
          return notFoundError("This invite is invalid or has expired.");
        }

        return Response.json(serializeInvitePreview(invite));
      },
      POST: async ({ request }) => {
        const sameOrigin = requireSameOrigin(request);

        if (!sameOrigin.ok) {
          return sameOrigin.error;
        }

        const parsed = await parseJsonBody(request, inviteRedeemSchema);

        if (!parsed.ok) {
          return parsed.error;
        }

        const invite = await getActiveInviteByToken(parsed.data.token);

        if (!invite) {
          return forbiddenError("This invite is invalid or has expired.");
        }

        if (invite.email.toLowerCase() !== parsed.data.email.toLowerCase()) {
          return forbiddenError(
            "This invite does not match that email address."
          );
        }

        const existingUser = await getUserByEmail(parsed.data.email);

        if (existingUser && existingUser.role !== ROLES.CLIENT) {
          return forbiddenError(
            "This email is already linked to a workspace admin account."
          );
        }

        const authAttempt = await authenticateInviteRedeem(
          request,
          parsed.data,
          Boolean(existingUser)
        );

        if (!authAttempt.ok) {
          return authAttempt.error;
        }

        const user = await getUserByEmail(parsed.data.email);

        if (!user) {
          return unauthorizedError("We could not load the invited account.");
        }

        const syncResult = await syncInviteRedeemUser(
          request,
          invite.token,
          invite.clientId,
          user.id
        );

        if (!syncResult.ok) {
          return syncResult.error;
        }

        return jsonWithHeaders(
          {
            success: true,
            user: {
              email: user.email,
              id: user.id,
              name: user.name,
              role: ROLES.CLIENT,
            },
          },
          authAttempt.authResult.status,
          authAttempt.authResult.headers
        );
      },
    },
  },
});
