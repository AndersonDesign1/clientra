import { createFileRoute } from "@tanstack/react-router";
import { ROLES } from "@/auth/roles";
import { getSessionUserFromHeaders } from "@/auth/session.server";
import { listPendingInvitesForClient } from "@/db/records";
import { forbiddenError, unauthorizedError } from "@/server/http/route-utils";

function serializePendingInvite(
  invite: Awaited<ReturnType<typeof listPendingInvitesForClient>>[number]
) {
  return {
    clientId: invite.clientId,
    createdAt: invite.createdAt,
    email: invite.email,
    expiresAt: invite.expiresAt,
    id: invite.id,
  };
}

export const Route = createFileRoute("/api/clients/$id/invites")({
  server: {
    handlers: {
      GET: async ({ params, request }) => {
        const user = await getSessionUserFromHeaders(request.headers);

        if (!user) {
          return unauthorizedError();
        }

        if (user.role !== ROLES.ADMIN) {
          return forbiddenError();
        }

        const invites = await listPendingInvitesForClient(params.id);

        return Response.json(invites.map(serializePendingInvite));
      },
    },
  },
});
