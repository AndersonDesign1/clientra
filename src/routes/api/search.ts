import { createFileRoute } from "@tanstack/react-router";
import { searchSchema } from "@/api/validation";
import { searchRecords, seedIfEmpty } from "@/db/records";

export const Route = createFileRoute("/api/search")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const url = new URL(request.url);
        const { query } = searchSchema.parse({
          query: url.searchParams.get("query") ?? "",
        });
        await seedIfEmpty();
        return Response.json(await searchRecords(query));
      },
    },
  },
});
