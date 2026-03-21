import { createFileRoute } from "@tanstack/react-router";
import {
  forbiddenError,
  internalServerError,
  parseJsonBody,
  requireSameOrigin,
  unauthorizedError,
} from "@/api/route-utils";
import { adminSignupSchema } from "@/api/validation";
import { auth } from "@/auth/better-auth";
import { ROLES } from "@/auth/roles";
import { getUserByEmail } from "@/auth/session.server";
import { hasWorkspaceAdmin, updateUserRole } from "@/db/records";

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

        await updateUserRole(user.id, ROLES.ADMIN);

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
