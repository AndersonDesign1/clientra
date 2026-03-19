import { createFileRoute } from "@tanstack/react-router";
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
        const body = await request.json();
        const client = createClientSchema.parse(body);
        const created = await createClientRecord({
          ...client,
          id: crypto.randomUUID(),
        });
        return Response.json(created, { status: 201 });
      },
    },
  },
});
