import { createFileRoute } from "@tanstack/react-router";
import { inviteSchema } from "@/api/validation";
import {
  createInviteRecord,
  getClientById,
  getInviteRecordById,
  revokeInviteRecord,
} from "@/db/records";
import { sendInviteEmail } from "@/server/email/notifications";
import {
  internalServerError,
  notFoundError,
  parseJsonBody,
  requireAdminMutationRequest,
} from "@/server/http/route-utils";

export const Route = createFileRoute("/api/invites")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const auth = await requireAdminMutationRequest(request);

        if (auth.error) {
          return auth.error;
        }

        const parsed = await parseJsonBody(request, inviteSchema);

        if (!parsed.ok) {
          return parsed.error;
        }

        const client = await getClientById(parsed.data.clientId);

        if (!client) {
          return notFoundError("We could not find a client with that id.");
        }

        const token = crypto.randomUUID();
        const inviteId = crypto.randomUUID();

        try {
          await createInviteRecord({
            clientId: parsed.data.clientId,
            email: parsed.data.email,
            expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7),
            id: inviteId,
            token,
          });
        } catch (error) {
          console.error("invite creation failed", error);
          return internalServerError("Invite could not be created.");
        }

        const invite = await getInviteRecordById(inviteId);

        if (!invite) {
          return internalServerError(
            "Invite was created but could not be reloaded."
          );
        }

        const inviteUrl = new URL(`/invite/${token}`, request.url);

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
          console.error("invite email failed", error);
          await revokeInviteRecord(invite.id);
          return internalServerError("Invite email could not be sent.");
        }

        return Response.json({
          ...invite,
          inviteLink: inviteUrl.toString(),
        });
      },
    },
  },
});
