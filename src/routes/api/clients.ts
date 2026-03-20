import { createFileRoute } from "@tanstack/react-router";
import { internalServerError, parseJsonBody } from "@/api/route-utils";
import { createClientSchema } from "@/api/validation";
import { createClientRecord, listClients, seedIfEmpty } from "@/db/records";

export const Route = createFileRoute("/api/clients")({
  server: {
    handlers: {
      GET: async () => {
        await seedIfEmpty();
        return Response.json(await listClients());
      },
      POST: async ({ request }) => {
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
