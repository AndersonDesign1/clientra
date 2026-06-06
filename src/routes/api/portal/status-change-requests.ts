import { createFileRoute } from "@tanstack/react-router";
import { statusChangeRequestSchema } from "@/api/validation";
import {
  canAccessProject,
  createStatusChangeRequestRecord,
  listStatusChangeRequestsForProject,
} from "@/db/records";
import {
  conflictError,
  forbiddenError,
  internalServerError,
  parseJsonBody,
  requireMutationSessionRequest,
  requireSessionRequest,
} from "@/server/http/route-utils";

export const Route = createFileRoute("/api/portal/status-change-requests")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const auth = await requireSessionRequest(request);
        if (auth.error) return auth.error;

        const url = new URL(request.url);
        const projectId = url.searchParams.get("projectId");

        if (!projectId) {
          return Response.json({ error: "projectId is required." }, { status: 400 });
        }

        const hasAccess = await canAccessProject(auth.user, projectId);
        if (!hasAccess) return forbiddenError("You do not have access to this project.");

        const requests = await listStatusChangeRequestsForProject(projectId);
        return Response.json(requests);
      },

      POST: async ({ request }) => {
        const auth = await requireMutationSessionRequest(request);
        if (auth.error) return auth.error;

        const parsed = await parseJsonBody(request, statusChangeRequestSchema);
        if (!parsed.ok) return parsed.error;

        const hasAccess = await canAccessProject(auth.user, parsed.data.projectId);
        if (!hasAccess) return forbiddenError("You do not have access to this project.");

        const existingRequests = await listStatusChangeRequestsForProject(parsed.data.projectId);
        const hasPending = existingRequests.some((r) => r.approvalState === "pending");
        if (hasPending) {
          return conflictError("A pending status change request already exists for this project.");
        }

        const created = await createStatusChangeRequestRecord({
          id: crypto.randomUUID(),
          projectId: parsed.data.projectId,
          reason: parsed.data.reason,
          requestedBy: auth.user.id,
          requestedStatus: parsed.data.requestedStatus,
        });

        if (!created) return internalServerError("Request could not be created.");

        return Response.json(created, { status: 201 });
      },
    },
  },
});
