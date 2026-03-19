import { createFileRoute } from "@tanstack/react-router";
import { inviteSchema } from "@/api/validation";

export const Route = createFileRoute("/api/invites")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const body = await request.json();
        const invite = inviteSchema.parse(body);
        return Response.json({
          ...invite,
          inviteLink: `https://clientra.app/invite/${crypto.randomUUID()}`,
        });
      },
    },
  },
});
