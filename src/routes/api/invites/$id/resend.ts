import { createFileRoute } from "@tanstack/react-router";
import {
  getActiveInviteById,
  getClientById,
  refreshInviteExpiration,
} from "@/db/records";
import { sendInviteEmail } from "@/server/email/notifications";
import {
  internalServerError,
  notFoundError,
  requireAdminMutationRequest,
} from "@/server/http/route-utils";

export const Route = createFileRoute("/api/invites/$id/resend")({
  server: {
    handlers: {
      POST: async ({ params, request }) => {
        const { id } = params;
        const auth = await requireAdminMutationRequest(request);

        if (auth.error) {
          return auth.error;
        }

        const invite = await getActiveInviteById(id);

        if (!invite) {
          return notFoundError("That pending invite could not be found.");
        }

        const client = await getClientById(invite.clientId);

        if (!client) {
          return notFoundError("The invited client could not be found.");
        }

        const inviteUrl = new URL(`/invite/${invite.token}`, request.url);

        try {
          await sendInviteEmail({
            clientCompany: client.company,
            clientName: client.name,
            email: invite.email,
            inviteId: invite.id,
            inviteUrl: inviteUrl.toString(),
            requestUrl: request.url,
          });
        } catch (error) {
          console.error("invite resend email failed", error);
          return internalServerError("Invite email could not be sent.");
        }

        const refreshedInvite = await refreshInviteExpiration(
          invite.id,
          new Date(Date.now() + 1000 * 60 * 60 * 24 * 7)
        );

        if (!refreshedInvite) {
          return internalServerError("Invite could not be refreshed.");
        }

        return Response.json({
          clientId: refreshedInvite.clientId,
          createdAt: refreshedInvite.createdAt,
          email: refreshedInvite.email,
          expiresAt: refreshedInvite.expiresAt,
          id: refreshedInvite.id,
        });
      },
    },
  },
});
