import { createFileRoute } from "@tanstack/react-router";
import { projectUpdateSchema } from "@/api/validation";
import { getSessionUserFromHeaders } from "@/auth/session.server";
import {
  canAccessProject,
  createProjectUpdateRecord,
  getProjectById,
  listProjectUpdatesForUser,
  serializeProjectUpdate,
} from "@/db/records";
import {
  forbiddenError,
  internalServerError,
  notFoundError,
  parseJsonBody,
  requireAdminMutationRequest,
  unauthorizedError,
} from "@/server/http/route-utils";

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
        const auth = await requireAdminMutationRequest(
          request,
          "Only admins can publish project updates."
        );

        if (auth.error) {
          return auth.error;
        }

        const project = await getProjectById(params.id);

        if (!project) {
          return notFoundError("We could not find a project with that id.");
        }

        const hasAccess = await canAccessProject(auth.user, params.id);

        if (!hasAccess) {
          return forbiddenError("You do not have access to this project.");
        }

        const parsed = await parseJsonBody(request, projectUpdateSchema);

        if (!parsed.ok) {
          return parsed.error;
        }

        const created = await createProjectUpdateRecord({
          ...parsed.data,
          authorId: auth.user.id,
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
