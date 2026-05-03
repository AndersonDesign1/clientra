import { createFileRoute } from "@tanstack/react-router";
import { createNoteSchema } from "@/api/validation";
import {
  canAccessProject,
  createProjectNoteRecord,
  getProjectNotificationContext,
  serializeProjectComment,
} from "@/db/records";
import {
  logNotificationFailure,
  notifyProjectComment,
} from "@/server/email/notifications";
import {
  forbiddenError,
  internalServerError,
  parseJsonBody,
  requireMutationSessionRequest,
} from "@/server/http/route-utils";

export const Route = createFileRoute("/api/notes")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const auth = await requireMutationSessionRequest(request);

        if (auth.error) {
          return auth.error;
        }

        const parsed = await parseJsonBody(request, createNoteSchema);

        if (!parsed.ok) {
          return parsed.error;
        }

        const canAccess = await canAccessProject(
          auth.user,
          parsed.data.projectId
        );

        if (!canAccess) {
          return forbiddenError("You do not have access to this project.");
        }

        const created = await createProjectNoteRecord({
          ...parsed.data,
          id: crypto.randomUUID(),
          userId: auth.user.id,
        });

        if (!created) {
          return internalServerError(
            "Note was created but could not be reloaded."
          );
        }

        const notificationContext = await getProjectNotificationContext(
          created.projectId
        );

        if (notificationContext) {
          notifyProjectComment({
            actor: auth.user,
            commentId: created.id,
            commentPreview: created.content,
            context: notificationContext,
          }).catch((error) => logNotificationFailure("comment", error));
        }

        return Response.json(serializeProjectComment(created), { status: 201 });
      },
    },
  },
});
