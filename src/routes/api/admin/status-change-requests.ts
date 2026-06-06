import { createFileRoute } from "@tanstack/react-router";
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
        if (auth.error) return auth.error;
        if (auth.user.role !== "admin") {
          return forbiddenError("Admin only.");
        }
        const requests = await listAllPendingStatusChangeRequests();
        return Response.json(requests);
      },
    },
  },
});
