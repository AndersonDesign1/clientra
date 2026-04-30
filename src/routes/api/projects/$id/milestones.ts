import { createFileRoute } from "@tanstack/react-router";
import {
  forbiddenError,
  internalServerError,
  notFoundError,
  parseJsonBody,
  requireSameOrigin,
  unauthorizedError,
} from "@/api/route-utils";
import { projectMilestoneSchema } from "@/api/validation";
import { ROLES } from "@/auth/roles";
import { getSessionUserFromHeaders } from "@/auth/session.server";
import {
  canAccessProject,
  createProjectMilestoneRecord,
  getProjectById,
  listProjectMilestonesForUser,
  serializeProjectMilestone,
} from "@/db/records";

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
        const sameOrigin = requireSameOrigin(request);

        if (!sameOrigin.ok) {
          return sameOrigin.error;
        }

        const user = await getSessionUserFromHeaders(request.headers);

        if (!user) {
          return unauthorizedError();
        }

        if (user.role !== ROLES.ADMIN) {
          return forbiddenError("Only admins can manage project milestones.");
        }

        const project = await getProjectById(params.id);

        if (!project) {
          return notFoundError("We could not find a project with that id.");
        }

        const hasAccess = await canAccessProject(user, params.id);

        if (!hasAccess) {
          return forbiddenError("You do not have access to this project.");
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
