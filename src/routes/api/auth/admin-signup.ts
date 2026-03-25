import { createFileRoute } from "@tanstack/react-router";
import { createRateLimiter } from "@/api/rate-limit";
import {
  forbiddenError,
  getClientAddress,
  internalServerError,
  parseJsonBody,
  requireSameOrigin,
  tooManyRequestsError,
  unauthorizedError,
} from "@/api/route-utils";
import { adminSignupSchema } from "@/api/validation";
import { auth } from "@/auth/better-auth";
import { ROLES } from "@/auth/roles";
import { getUserByEmail } from "@/auth/session.server";
import {
  deleteUserById,
  hasWorkspaceAdmin,
  promoteUserToInitialAdmin,
} from "@/db/records";

const adminSignupRateLimiter = createRateLimiter({
  maxAttempts: 3,
  windowMs: 10 * 60 * 1000,
});

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

export const Route = createFileRoute("/api/auth/admin-signup")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const sameOrigin = requireSameOrigin(request);

        if (!sameOrigin.ok) {
          return sameOrigin.error;
        }

        const rateLimitKey = ["admin-signup", getClientAddress(request)].join(
          ":"
        );
        const rateLimit = adminSignupRateLimiter.check(rateLimitKey);

        if (!rateLimit.ok) {
          return tooManyRequestsError(
            "Too many admin signup attempts. Please try again later.",
            rateLimit.retryAfterSeconds
          );
        }

        if (await hasWorkspaceAdmin()) {
          return forbiddenError("Admin signup is closed for this workspace.");
        }

        const parsed = await parseJsonBody(request, adminSignupSchema);

        if (!parsed.ok) {
          return parsed.error;
        }

        let authResult: AuthApiResult;

        try {
          authResult = (await auth.api.signUpEmail({
            body: {
              callbackURL: "/dashboard",
              email: parsed.data.email,
              name: parsed.data.name,
              password: parsed.data.password,
            },
            headers: request.headers,
            returnHeaders: true,
            returnStatus: true,
          })) as AuthApiResult;
        } catch (error) {
          console.error("admin signup failed", error);
          return unauthorizedError("We could not complete admin signup.");
        }

        if (authResult.status < 200 || authResult.status >= 300) {
          return unauthorizedError("We could not complete admin signup.");
        }

        const user = await getUserByEmail(parsed.data.email);

        if (!user) {
          return internalServerError(
            "Admin account was created but could not be reloaded."
          );
        }

        try {
          const promoted = await promoteUserToInitialAdmin(user.id);

          if (!promoted) {
            const deleted = await deleteUserById(user.id);

            if (!deleted) {
              console.error("admin signup bootstrap cleanup failed", {
                userId: user.id,
              });

              return internalServerError(
                "Admin signup could not be completed safely."
              );
            }

            return forbiddenError("Admin signup is closed for this workspace.");
          }
        } catch (error) {
          console.error("admin signup promotion failed", error);

          const deleted = await deleteUserById(user.id);

          if (!deleted) {
            console.error("admin signup rollback failed", {
              userId: user.id,
            });
          }

          return internalServerError("We could not complete admin signup.");
        }

        return jsonWithHeaders(
          {
            success: true,
            user: {
              email: user.email,
              id: user.id,
              name: user.name,
              role: ROLES.ADMIN,
            },
          },
          authResult.status,
          authResult.headers
        );
      },
    },
  },
});
