import { createFileRoute } from "@tanstack/react-router";
import { projectMilestoneSchema } from "@/api/validation";
import {
  deleteProjectMilestoneRecord,
  serializeProjectMilestone,
  updateProjectMilestoneRecord,
} from "@/db/records";
import {
  notFoundError,
  parseJsonBody,
  requireAdminMutationRequest,
} from "@/server/http/route-utils";

export const Route = createFileRoute("/api/project-milestones/$id")({
  server: {
    handlers: {
      PATCH: async ({ params, request }) => {
        const auth = await requireAdminMutationRequest(
          request,
          "Only admins can manage project milestones."
        );

        if (auth.error) {
          return auth.error;
        }

        const parsed = await parseJsonBody(request, projectMilestoneSchema);

        if (!parsed.ok) {
          return parsed.error;
        }

        const updated = await updateProjectMilestoneRecord(
          params.id,
          parsed.data
        );

        if (!updated) {
          return notFoundError("That milestone could not be found.");
        }

        return Response.json(serializeProjectMilestone(updated));
      },
      DELETE: async ({ params, request }) => {
        const auth = await requireAdminMutationRequest(
          request,
          "Only admins can manage project milestones."
        );

        if (auth.error) {
          return auth.error;
        }

        const deleted = await deleteProjectMilestoneRecord(params.id);

        if (!deleted) {
          return notFoundError("That milestone could not be found.");
        }

        return Response.json({ success: true });
      },
    },
  },
});
