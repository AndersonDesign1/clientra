import { createFileRoute } from "@tanstack/react-router";
import { forbiddenError, unauthorizedError } from "@/api/route-utils";
import { ROLES } from "@/auth/roles";
import { getSessionUserFromHeaders } from "@/auth/session.server";
import { listDashboardActivity } from "@/db/records";

export const Route = createFileRoute("/api/dashboard/activity")({
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

        return Response.json(await listDashboardActivity());
      },
    },
  },
});
