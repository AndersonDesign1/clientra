import { createFileRoute } from "@tanstack/react-router";
import { forbiddenError, unauthorizedError } from "@/api/route-utils";
import { getSessionUserFromHeaders } from "@/auth/session.server";
import { listProjectFilesForUser, serializeProjectFile } from "@/db/records";

export const Route = createFileRoute("/api/projects/$id/files")({
  server: {
    handlers: {
      GET: async ({ params, request }) => {
        const user = await getSessionUserFromHeaders(request.headers);

        if (!user) {
          return unauthorizedError();
        }

        const files = await listProjectFilesForUser(params.id, user);

        if (!files) {
          return forbiddenError();
        }

        return Response.json(files.map(serializeProjectFile));
      },
    },
  },
});
