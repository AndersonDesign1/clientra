import { createFileRoute } from "@tanstack/react-router";
import { getSessionUserFromHeaders } from "@/auth/session.server";
import { getPortalSummary, seedIfEmpty } from "@/db/records";
import { unauthorizedError } from "@/server/http/route-utils";

export const Route = createFileRoute("/api/portal/summary")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const user = await getSessionUserFromHeaders(request.headers);

        if (!user) {
          return unauthorizedError();
        }

        await seedIfEmpty();

        return Response.json(await getPortalSummary(user));
      },
    },
  },
});
