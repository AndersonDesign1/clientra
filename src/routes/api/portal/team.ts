import { createFileRoute } from "@tanstack/react-router";
import { portalInviteSchema } from "@/api/validation";
import { getSessionUserFromHeaders } from "@/auth/session.server";
import {
  createPortalColleagueInvite,
  getClientById,
  listPortalTeam,
} from "@/db/records";

import { sendInviteEmail } from "@/server/email/notifications";
import {
  forbiddenError,
  internalServerError,
  parseJsonBody,
  requireMutationSessionRequest,
  unauthorizedError,
} from "@/server/http/route-utils";

export const Route = createFileRoute("/api/portal/team")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const user = await getSessionUserFromHeaders(request.headers);
        if (!user) return unauthorizedError();
        if (user.role !== "client") return forbiddenError("Client portal only.");
        const team = await listPortalTeam(user);
        return Response.json(team);
      },

      POST: async ({ request }) => {
        const auth = await requireMutationSessionRequest(request);
        if (auth.error) return auth.error;
        if (auth.user.role !== "client") return forbiddenError("Client portal only.");

        const parsed = await parseJsonBody(request, portalInviteSchema);
        if (!parsed.ok) return parsed.error;

        // Get this client's clientId
        const team = await listPortalTeam(auth.user);
        if (!team.clientId) return forbiddenError("No client linked to your account.");

        const client = await getClientById(team.clientId);
        if (!client) return internalServerError("Client not found.");

        const token = crypto.randomUUID();
        const inviteId = crypto.randomUUID();

        const invite = await createPortalColleagueInvite({
          clientId: team.clientId,
          email: parsed.data.email,
          id: inviteId,
          initiatedByClientId: team.clientId,
          token,
        });

        if (!invite) return internalServerError("Invite could not be created.");

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
          console.error("portal invite email failed", error);
          // Don't roll back — the invite is still valid, email is best-effort
        }

        return Response.json(invite, { status: 201 });
      },
    },
  },
});
