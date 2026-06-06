import { createFileRoute } from "@tanstack/react-router";
import { getSessionUserFromHeaders } from "@/auth/session.server";
import { listPortalFilesForUser } from "@/db/records";
import { unauthorizedError } from "@/server/http/route-utils";

export const Route = createFileRoute("/api/portal/files")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const user = await getSessionUserFromHeaders(request.headers);
        if (!user) return unauthorizedError();
        if (user.role !== "client") return unauthorizedError();
        const files = await listPortalFilesForUser(user);
        return Response.json(files);
      },
    },
  },
});
