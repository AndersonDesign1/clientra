import { createFileRoute } from "@tanstack/react-router";
import { portalInviteSchema } from "@/api/validation";
import { getSessionUserFromHeaders } from "@/auth/session.server";
import { createPortalColleagueInvite, listPortalTeam } from "@/db/records";
import {
  forbiddenError,
  internalServerError,
  parseJsonBody,
  requireMutationSessionRequest,
  unauthorizedError,
} from "@/server/http/route-utils";

function serializePortalColleagueInvite(
  invite: NonNullable<Awaited<ReturnType<typeof createPortalColleagueInvite>>>
) {
  return {
    adminApprovedAt: invite.adminApprovedAt?.toISOString() ?? null,
    clientId: invite.clientId,
    createdAt: invite.createdAt.toISOString(),
    email: invite.email,
    expiresAt: invite.expiresAt.toISOString(),
    id: invite.id,
    initiatedByClientId: invite.initiatedByClientId,
  };
}

export const Route = createFileRoute("/api/portal/team")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const user = await getSessionUserFromHeaders(request.headers);
        if (!user) {
          return unauthorizedError();
        }
        if (user.role !== "client") {
          return forbiddenError("Client portal only.");
        }
        const team = await listPortalTeam(user);
        return Response.json(team);
      },

      POST: async ({ request }) => {
        const auth = await requireMutationSessionRequest(request);
        if (auth.error) {
          return auth.error;
        }
        if (auth.user.role !== "client") {
          return forbiddenError("Client portal only.");
        }

        const parsed = await parseJsonBody(request, portalInviteSchema);
        if (!parsed.ok) {
          return parsed.error;
        }

        // Get this client's clientId
        const team = await listPortalTeam(auth.user);
        if (!team.clientId) {
          return forbiddenError("No client linked to your account.");
        }

        const token = crypto.randomUUID();
        const inviteId = crypto.randomUUID();

        const invite = await createPortalColleagueInvite({
          clientId: team.clientId,
          email: parsed.data.email,
          id: inviteId,
          initiatedByClientId: team.clientId,
          token,
        });

        if (!invite) {
          return internalServerError("Invite could not be created.");
        }

        const isNew = invite.id === inviteId;

        return Response.json(serializePortalColleagueInvite(invite), {
          status: isNew ? 201 : 200,
        });
      },
    },
  },
});
