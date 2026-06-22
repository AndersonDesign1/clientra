import { createFileRoute } from "@tanstack/react-router";
import { ROLES } from "@/auth/roles";
import { getSessionUserFromHeaders } from "@/auth/session.server";
import { getPortalSummary } from "@/db/records";
import { forbiddenError, unauthorizedError } from "@/server/http/route-utils";

export const Route = createFileRoute("/api/portal/summary")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const user = await getSessionUserFromHeaders(request.headers);

        if (!user) {
          return unauthorizedError();
        }

        if (user.role !== ROLES.CLIENT) {
          return forbiddenError("Client portal only.");
        }

        return Response.json(await getPortalSummary(user));
      },
    },
  },
});
