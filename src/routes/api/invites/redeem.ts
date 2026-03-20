import { createFileRoute } from "@tanstack/react-router";
import {
  forbiddenError,
  notFoundError,
  parseJsonBody,
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

interface AuthApiResult {
  headers: Headers;
  response: unknown;
  status: number;
}

function jsonWithHeaders(body: unknown, status: number, headers: Headers) {
  return new Response(JSON.stringify(body), {
    headers,
    status,
  });
}

export const Route = createFileRoute("/api/invites/redeem")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const url = new URL(request.url);
        const token = url.searchParams.get("token");

        if (!token) {
          return notFoundError("Invite token is required.");
        }

        const invite = await getActiveInviteByToken(token);

        if (!invite || invite.expiresAt.getTime() < Date.now()) {
          return notFoundError("This invite is invalid or has expired.");
        }

        return Response.json({
          email: invite.email,
          expiresAt: invite.expiresAt.toISOString(),
        });
      },
      POST: async ({ request }) => {
        const parsed = await parseJsonBody(request, inviteRedeemSchema);

        if (!parsed.ok) {
          return parsed.error;
        }

        const invite = await getActiveInviteByToken(parsed.data.token);

        if (!invite || invite.expiresAt.getTime() < Date.now()) {
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

        let authResult: AuthApiResult;

        try {
          if (existingUser) {
            authResult = (await auth.api.signInEmail({
              body: {
                callbackURL: "/portal",
                email: parsed.data.email,
                password: parsed.data.password,
              },
              headers: request.headers,
              returnHeaders: true,
              returnStatus: true,
            })) as AuthApiResult;
          } else {
            authResult = (await auth.api.signUpEmail({
              body: {
                callbackURL: "/portal",
                email: parsed.data.email,
                name: parsed.data.name,
                password: parsed.data.password,
              },
              headers: request.headers,
              returnHeaders: true,
              returnStatus: true,
            })) as AuthApiResult;
          }
        } catch (error) {
          console.error("invite redeem sign-in failed", error);
          return unauthorizedError("We could not complete invite sign-in.");
        }

        if (authResult.status < 200 || authResult.status >= 300) {
          return unauthorizedError("We could not complete invite sign-in.");
        }

        const user = await getUserByEmail(parsed.data.email);

        if (!user) {
          return unauthorizedError("We could not load the invited account.");
        }

        try {
          const didConsumeInvite = await db.transaction(async (tx) => {
            const consumed = await consumeInvite(invite.token, tx);

            if (!consumed) {
              return false;
            }

            await updateUserRole(user.id, ROLES.CLIENT, tx);
            await linkUserToClient(invite.clientId, user.id, tx);

            return true;
          });

          if (!didConsumeInvite) {
            return forbiddenError("This invite is invalid or has expired.");
          }
        } catch (error) {
          console.error("invite redeem post-auth sync failed", error);
          return unauthorizedError("We could not complete invite sign-in.");
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
          authResult.status,
          authResult.headers
        );
      },
    },
  },
});
