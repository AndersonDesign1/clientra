import { createFileRoute } from "@tanstack/react-router";
import {
  forbiddenError,
  internalServerError,
  parseJsonBody,
  unauthorizedError,
} from "@/api/route-utils";
import { createClientSchema } from "@/api/validation";
import { ROLES } from "@/auth/roles";
import { getSessionUserFromHeaders } from "@/auth/session.server";
import {
  createClientRecord,
  listClientsForUser,
  seedIfEmpty,
} from "@/db/records";

export const Route = createFileRoute("/api/clients")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const user = await getSessionUserFromHeaders(request.headers);

        if (!user) {
          return unauthorizedError();
        }

        await seedIfEmpty();

        return Response.json(await listClientsForUser(user));
      },
      POST: async ({ request }) => {
        const user = await getSessionUserFromHeaders(request.headers);

        if (!user) {
          return unauthorizedError();
        }

        if (user.role !== ROLES.ADMIN) {
          return forbiddenError();
        }

        const parsed = await parseJsonBody(request, createClientSchema);

        if (!parsed.ok) {
          return parsed.error;
        }

        const created = await createClientRecord({
          ...parsed.data,
          id: crypto.randomUUID(),
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
