import { createFileRoute } from "@tanstack/react-router";
import {
  forbiddenError,
  internalServerError,
  parseJsonBody,
  requireSameOrigin,
  unauthorizedError,
} from "@/api/route-utils";
import { inviteSchema } from "@/api/validation";
import { ROLES } from "@/auth/roles";
import { getSessionUserFromHeaders } from "@/auth/session.server";
import { createInviteRecord, getInviteRecordById } from "@/db/records";

export const Route = createFileRoute("/api/invites")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const sameOrigin = requireSameOrigin(request);

        if (!sameOrigin.ok) {
          return sameOrigin.error;
        }

        const user = await getSessionUserFromHeaders(request.headers);

        if (!user) {
          return unauthorizedError();
        }

        if (user.role !== ROLES.ADMIN) {
          return forbiddenError();
        }

        const parsed = await parseJsonBody(request, inviteSchema);

        if (!parsed.ok) {
          return parsed.error;
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

        return Response.json({
          ...invite,
          inviteLink: inviteUrl.toString(),
        });
      },
    },
  },
});
