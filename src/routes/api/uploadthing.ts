import { createFileRoute } from "@tanstack/react-router";
import { uploadthingHandler } from "@/uploadthing/core";

export const Route = createFileRoute("/api/uploadthing")({
  server: {
    handlers: {
      GET: async ({ request }) => uploadthingHandler(request),
      POST: async ({ request }) => uploadthingHandler(request),
    },
  },
});
