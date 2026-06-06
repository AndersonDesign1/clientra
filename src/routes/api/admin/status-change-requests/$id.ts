import { createFileRoute } from "@tanstack/react-router";
import { reviewStatusChangeRequestSchema } from "@/api/validation";
import { reviewStatusChangeRequestRecord } from "@/db/records";
import {
  notFoundError,
  parseJsonBody,
  requireAdminMutationRequest,
} from "@/server/http/route-utils";

export const Route = createFileRoute("/api/admin/status-change-requests/$id")({
  server: {
    handlers: {
      PATCH: async ({ request, params }) => {
        const auth = await requireAdminMutationRequest(request);
        if (auth.error) return auth.error;

        const parsed = await parseJsonBody(request, reviewStatusChangeRequestSchema);
        if (!parsed.ok) return parsed.error;

        const updated = await reviewStatusChangeRequestRecord(
          params.id,
          auth.user.id,
          parsed.data.approvalState
        );

        if (!updated) return notFoundError("Request not found or already reviewed.");

        return Response.json(updated);
      },
    },
  },
});
