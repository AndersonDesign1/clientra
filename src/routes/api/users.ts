import { createFileRoute } from "@tanstack/react-router";
import { ROLES } from "@/auth/roles";
import { getSessionUserFromHeaders } from "@/auth/session.server";
import { listUsersForAdmin } from "@/db/records";
import { forbiddenError, unauthorizedError } from "@/server/http/route-utils";

export const Route = createFileRoute("/api/users")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const user = await getSessionUserFromHeaders(request.headers);

        if (!user) {
          return unauthorizedError();
        }

        if (user.role !== ROLES.ADMIN) {
          return forbiddenError();
        }

        return Response.json(await listUsersForAdmin());
      },
    },
  },
});
