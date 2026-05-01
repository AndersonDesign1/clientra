import { createFileRoute } from "@tanstack/react-router";
import {
  forbiddenError,
  notFoundError,
  parseJsonBody,
  requireSameOrigin,
  unauthorizedError,
} from "@/api/route-utils";
import { projectUpdateSchema } from "@/api/validation";
import { ROLES } from "@/auth/roles";
import { getSessionUserFromHeaders } from "@/auth/session.server";
import {
  deleteProjectUpdateRecord,
  serializeProjectUpdate,
  updateProjectUpdateRecord,
} from "@/db/records";

async function requireAdminRequest(request: Request) {
  const sameOrigin = requireSameOrigin(request);

  if (!sameOrigin.ok) {
    return { error: sameOrigin.error, user: null };
  }

  const user = await getSessionUserFromHeaders(request.headers);

  if (!user) {
    return { error: unauthorizedError(), user: null };
  }

  if (user.role !== ROLES.ADMIN) {
    return {
      error: forbiddenError("Only admins can manage project updates."),
      user: null,
    };
  }

  return { error: null, user };
}

export const Route = createFileRoute("/api/project-updates/$id")({
  server: {
    handlers: {
      PATCH: async ({ params, request }) => {
        const auth = await requireAdminRequest(request);

        if (auth.error) {
          return auth.error;
        }

        const parsed = await parseJsonBody(request, projectUpdateSchema);

        if (!parsed.ok) {
          return parsed.error;
        }

        const updated = await updateProjectUpdateRecord(params.id, parsed.data);

        if (!updated) {
          return notFoundError("That project update could not be found.");
        }

        return Response.json(serializeProjectUpdate(updated));
      },
      DELETE: async ({ params, request }) => {
        const auth = await requireAdminRequest(request);

        if (auth.error) {
          return auth.error;
        }

        const deleted = await deleteProjectUpdateRecord(params.id);

        if (!deleted) {
          return notFoundError("That project update could not be found.");
        }

        return Response.json({ success: true });
      },
    },
  },
});
