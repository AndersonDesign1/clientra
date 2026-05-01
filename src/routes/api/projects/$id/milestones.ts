import { createFileRoute } from "@tanstack/react-router";
import { projectMilestoneSchema } from "@/api/validation";
import { getSessionUserFromHeaders } from "@/auth/session.server";
import {
  createProjectMilestoneRecord,
  getProjectById,
  listProjectMilestonesForUser,
  serializeProjectMilestone,
} from "@/db/records";
import {
  forbiddenError,
  internalServerError,
  notFoundError,
  parseJsonBody,
  requireAdminMutationRequest,
  unauthorizedError,
} from "@/server/http/route-utils";

export const Route = createFileRoute("/api/projects/$id/milestones")({
  server: {
    handlers: {
      GET: async ({ params, request }) => {
        const user = await getSessionUserFromHeaders(request.headers);

        if (!user) {
          return unauthorizedError();
        }

        const milestones = await listProjectMilestonesForUser(params.id, user);

        if (!milestones) {
          return forbiddenError("You do not have access to this project.");
        }

        return Response.json(milestones.map(serializeProjectMilestone));
      },
      POST: async ({ params, request }) => {
        const auth = await requireAdminMutationRequest(
          request,
          "Only admins can manage project milestones."
        );

        if (auth.error) {
          return auth.error;
        }

        const project = await getProjectById(params.id);

        if (!project) {
          return notFoundError("We could not find a project with that id.");
        }

        const parsed = await parseJsonBody(request, projectMilestoneSchema);

        if (!parsed.ok) {
          return parsed.error;
        }

        const created = await createProjectMilestoneRecord({
          ...parsed.data,
          id: crypto.randomUUID(),
          projectId: params.id,
        });

        if (!created) {
          return internalServerError(
            "Milestone was created but could not be reloaded."
          );
        }

        return Response.json(serializeProjectMilestone(created), {
          status: 201,
        });
      },
    },
  },
});
