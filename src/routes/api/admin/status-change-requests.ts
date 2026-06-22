import { createFileRoute } from "@tanstack/react-router";
import { ROLES } from "@/auth/roles";
import { listAllPendingStatusChangeRequests } from "@/db/records";
import {
  forbiddenError,
  requireSessionRequest,
} from "@/server/http/route-utils";

export const Route = createFileRoute("/api/admin/status-change-requests")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const auth = await requireSessionRequest(request);
        if (auth.error) {
          return auth.error;
        }
        if (auth.user.role !== ROLES.ADMIN) {
          return forbiddenError("Admin only.");
        }
        const requests = await listAllPendingStatusChangeRequests(
          auth.user.activeOrganizationId ?? null
        );
        return Response.json(requests);
      },
    },
  },
});
