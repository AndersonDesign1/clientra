import { createFileRoute } from "@tanstack/react-router";
import {
  forbiddenError,
  internalServerError,
  notFoundError,
  parseJsonBody,
  requireSameOrigin,
  unauthorizedError,
} from "@/api/route-utils";
import { projectUpdateSchema } from "@/api/validation";
import { ROLES } from "@/auth/roles";
import { getSessionUserFromHeaders } from "@/auth/session.server";
import {
  canAccessProject,
  createProjectUpdateRecord,
  getProjectById,
  listProjectUpdatesForUser,
  serializeProjectUpdate,
} from "@/db/records";

export const Route = createFileRoute("/api/projects/$id/updates")({
  server: {
    handlers: {
      GET: async ({ params, request }) => {
        const user = await getSessionUserFromHeaders(request.headers);

        if (!user) {
          return unauthorizedError();
        }

        const updates = await listProjectUpdatesForUser(params.id, user);

        if (!updates) {
          return forbiddenError("You do not have access to this project.");
        }

        return Response.json(updates.map(serializeProjectUpdate));
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
          return forbiddenError("Only admins can publish project updates.");
        }

        const project = await getProjectById(params.id);

        if (!project) {
          return notFoundError("We could not find a project with that id.");
        }

        const hasAccess = await canAccessProject(user, params.id);

        if (!hasAccess) {
          return forbiddenError("You do not have access to this project.");
        }

        const parsed = await parseJsonBody(request, projectUpdateSchema);

        if (!parsed.ok) {
          return parsed.error;
        }

        const created = await createProjectUpdateRecord({
          ...parsed.data,
          authorId: user.id,
          id: crypto.randomUUID(),
          projectId: params.id,
        });

        if (!created) {
          return internalServerError(
            "Project update was created but could not be reloaded."
          );
        }

        return Response.json(serializeProjectUpdate(created), { status: 201 });
      },
    },
  },
});
