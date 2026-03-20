import { createFileRoute } from "@tanstack/react-router";
import { parseJsonBody } from "@/api/route-utils";
import { inviteSchema } from "@/api/validation";

export const Route = createFileRoute("/api/invites")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const parsed = await parseJsonBody(request, inviteSchema);

        if (!parsed.ok) {
          return parsed.error;
        }

        const inviteUrl = new URL(
          `/invite/${crypto.randomUUID()}`,
          request.url
        );

        return Response.json({
          ...parsed.data,
          inviteLink: inviteUrl.toString(),
        });
      },
    },
  },
});
