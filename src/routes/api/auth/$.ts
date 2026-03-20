/* biome-ignore lint/style/useFilenamingConvention: TanStack Start splat routes require this filename. */
import { createFileRoute } from "@tanstack/react-router";
import { auth } from "@/auth/better-auth";

const handler = async ({ request }: { request: Request }) =>
  auth.handler(request);

export const Route = createFileRoute("/api/auth/$")({
  server: {
    handlers: {
      DELETE: handler,
      GET: handler,
      PATCH: handler,
      POST: handler,
      PUT: handler,
    },
  },
});
