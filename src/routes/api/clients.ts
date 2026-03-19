import { createFileRoute } from "@tanstack/react-router";
import { createClientSchema } from "@/api/validation";
import { clients } from "@/features/clients/mock-data";

export const Route = createFileRoute("/api/clients")({
  server: {
    handlers: {
      GET: () => {
        return Response.json(clients);
      },
      POST: async ({ request }) => {
        const body = await request.json();
        const client = createClientSchema.parse(body);
        return Response.json(client);
      },
    },
  },
});
