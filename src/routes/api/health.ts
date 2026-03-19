import { createFileRoute } from "@tanstack/react-router";
import { checkDatabaseHealth } from "@/db/records";

export const Route = createFileRoute("/api/health")({
  server: {
    handlers: {
      GET: async () => {
        await checkDatabaseHealth();
        return Response.json({ database: "ok", status: "ok" });
      },
    },
  },
});
