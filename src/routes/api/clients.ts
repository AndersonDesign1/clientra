import { createFileRoute } from "@tanstack/react-router";
import { createClientSchema } from "@/api/validation";
import { getSessionUserFromHeaders } from "@/auth/session.server";
import { createClientRecord, listClientsForUser } from "@/db/records";
import {
  forbiddenError,
  internalServerError,
  parseJsonBody,
  requireAdminMutationRequest,
  unauthorizedError,
} from "@/server/http/route-utils";

export const Route = createFileRoute("/api/clients")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const user = await getSessionUserFromHeaders(request.headers);

        if (!user) {
          return unauthorizedError();
        }

        return Response.json(await listClientsForUser(user));
      },
      POST: async ({ request }) => {
        const auth = await requireAdminMutationRequest(request);

        if (auth.error) {
          return auth.error;
        }

        const parsed = await parseJsonBody(request, createClientSchema);

        if (!parsed.ok) {
          return parsed.error;
        }

        if (!auth.user.activeOrganizationId) {
          return forbiddenError("No active organization selected.");
        }

        const created = await createClientRecord({
          ...parsed.data,
          id: crypto.randomUUID(),
          organizationId: auth.user.activeOrganizationId,
        });

        if (!created) {
          return internalServerError(
            "Client was created but could not be reloaded."
          );
        }

        return Response.json(created, { status: 201 });
      },
    },
  },
});
