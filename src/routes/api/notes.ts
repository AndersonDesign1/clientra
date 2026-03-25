import { createFileRoute } from "@tanstack/react-router";
import {
  forbiddenError,
  internalServerError,
  parseJsonBody,
  requireSameOrigin,
  unauthorizedError,
} from "@/api/route-utils";
import { createNoteSchema } from "@/api/validation";
import { getSessionUserFromHeaders } from "@/auth/session.server";
import { canAccessProject, createProjectNoteRecord } from "@/db/records";

export const Route = createFileRoute("/api/notes")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const sameOrigin = requireSameOrigin(request);

        if (!sameOrigin.ok) {
          return sameOrigin.error;
        }

        const sessionUser = await getSessionUserFromHeaders(request.headers);

        if (!sessionUser) {
          return unauthorizedError();
        }

        const parsed = await parseJsonBody(request, createNoteSchema);

        if (!parsed.ok) {
          return parsed.error;
        }

        const canAccess = await canAccessProject(
          sessionUser,
          parsed.data.projectId
        );

        if (!canAccess) {
          return forbiddenError("You do not have access to this project.");
        }

        const created = await createProjectNoteRecord({
          ...parsed.data,
          id: crypto.randomUUID(),
          userId: sessionUser.id,
        });

        if (!created) {
          return internalServerError(
            "Note was created but could not be reloaded."
          );
        }

        return Response.json(created, { status: 201 });
      },
    },
  },
});
