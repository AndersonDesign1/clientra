import { createFileRoute } from "@tanstack/react-router";
import { getSessionUserFromHeaders } from "@/auth/session.server";
import {
  canAccessProject,
  getProjectCollaboration,
  seedIfEmpty,
} from "@/db/records";
import {
  forbiddenError,
  notFoundError,
  unauthorizedError,
} from "@/server/http/route-utils";

export const Route = createFileRoute("/api/projects/$id/collaboration")({
  server: {
    handlers: {
      GET: async ({ params, request }) => {
        const user = await getSessionUserFromHeaders(request.headers);

        if (!user) {
          return unauthorizedError();
        }

        await seedIfEmpty();

        const hasAccess = await canAccessProject(user, params.id);

        if (!hasAccess) {
          return forbiddenError("You do not have access to this project.");
        }

        const collaboration = await getProjectCollaboration(params.id);

        if (!collaboration) {
          return notFoundError("We could not find a project with that id.");
        }

        return Response.json(collaboration);
      },
    },
  },
});
