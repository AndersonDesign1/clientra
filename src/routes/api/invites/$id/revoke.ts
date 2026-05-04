import { createFileRoute } from "@tanstack/react-router";
import { revokeInviteRecord } from "@/db/records";
import {
  notFoundError,
  requireAdminMutationRequest,
} from "@/server/http/route-utils";

export const Route = createFileRoute("/api/invites/$id/revoke")({
  server: {
    handlers: {
      POST: async ({ params, request }) => {
        const { id } = params;
        const auth = await requireAdminMutationRequest(request);

        if (auth.error) {
          return auth.error;
        }

        const invite = await revokeInviteRecord(id);

        if (!invite) {
          return notFoundError("That pending invite could not be found.");
        }

        return Response.json({ success: true });
      },
    },
  },
});
