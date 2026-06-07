import { createFileRoute } from "@tanstack/react-router";
import { reviewStatusChangeRequestSchema } from "@/api/validation";
import {
  getStatusChangeRequestById,
  reviewStatusChangeRequestRecord,
} from "@/db/records";
import {
  conflictError,
  notFoundError,
  parseJsonBody,
  requireAdminMutationRequest,
} from "@/server/http/route-utils";

export const Route = createFileRoute("/api/admin/status-change-requests/$id")({
  server: {
    handlers: {
      PATCH: async ({ request, params }) => {
        const auth = await requireAdminMutationRequest(request);
        if (auth.error) {
          return auth.error;
        }

        const parsed = await parseJsonBody(
          request,
          reviewStatusChangeRequestSchema
        );
        if (!parsed.ok) {
          return parsed.error;
        }

        const requestRecord = await getStatusChangeRequestById(params.id);
        if (!requestRecord) {
          return notFoundError("Request not found");
        }
        if (requestRecord.approvalState !== "pending") {
          return conflictError("Request already reviewed");
        }

        try {
          const updated = await reviewStatusChangeRequestRecord(
            params.id,
            auth.user.id,
            parsed.data.approvalState
          );

          if (!updated) {
            return notFoundError("Request not found or already reviewed.");
          }

          return Response.json(updated);
        } catch (err) {
          console.error("Failed to review status change request:", err);
          return Response.json(
            { error: "Unable to process request" },
            { status: 400 }
          );
        }
      },
    },
  },
});
