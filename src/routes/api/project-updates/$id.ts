import { createFileRoute } from "@tanstack/react-router";
import { projectUpdateSchema } from "@/api/validation";
import {
  deleteProjectUpdateRecord,
  serializeProjectUpdate,
  updateProjectUpdateRecord,
} from "@/db/records";
import {
  notFoundError,
  parseJsonBody,
  requireAdminMutationRequest,
} from "@/server/http/route-utils";

export const Route = createFileRoute("/api/project-updates/$id")({
  server: {
    handlers: {
      PATCH: async ({ params, request }) => {
        const auth = await requireAdminMutationRequest(
          request,
          "Only admins can manage project updates."
        );

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
        const auth = await requireAdminMutationRequest(
          request,
          "Only admins can manage project updates."
        );

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
