import { createFileRoute } from "@tanstack/react-router";
import {
  approveInviteRecord,
  getClientById,
} from "@/db/records";
import { sendInviteEmail } from "@/server/email/notifications";
import {
  notFoundError,
  requireAdminMutationRequest,
} from "@/server/http/route-utils";

export const Route = createFileRoute("/api/invites/$id/approve")({
  server: {
    handlers: {
      POST: async ({ params, request }) => {
        const { id } = params;
        const auth = await requireAdminMutationRequest(request);

        if (auth.error) {
          return auth.error;
        }

        const approvedInvite = await approveInviteRecord(id);

        if (!approvedInvite) {
          return notFoundError("That pending invite could not be found or approved.");
        }

        const client = await getClientById(approvedInvite.clientId);

        if (!client) {
          return notFoundError("The invited client could not be found.");
        }

        const inviteUrl = new URL(`/invite/${approvedInvite.token}`, request.url);

        let emailSent = true;
        try {
          await sendInviteEmail({
            clientCompany: client.company,
            clientName: client.name,
            email: approvedInvite.email,
            inviteId: approvedInvite.id,
            inviteUrl: inviteUrl.toString(),
            requestUrl: request.url,
          });
        } catch (error) {
          console.error("invite approval email failed", error);
          emailSent = false;
        }

        return Response.json({
          clientId: approvedInvite.clientId,
          createdAt: approvedInvite.createdAt.toISOString(),
          email: approvedInvite.email,
          expiresAt: approvedInvite.expiresAt.toISOString(),
          id: approvedInvite.id,
          adminApprovedAt: approvedInvite.adminApprovedAt?.toISOString() ?? null,
          initiatedByClientId: approvedInvite.initiatedByClientId,
          emailSent,
        });
      },
    },
  },
});
