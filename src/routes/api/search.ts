import { createFileRoute } from "@tanstack/react-router";
import { searchSchema } from "@/api/validation";
import { clients } from "@/features/clients/mock-data";
import { projects } from "@/features/projects/mock-data";

export const Route = createFileRoute("/api/search")({
  server: {
    handlers: {
      GET: ({ request }) => {
        const url = new URL(request.url);
        const { query } = searchSchema.parse({
          query: url.searchParams.get("query") ?? "",
        });
        const lower = query.toLowerCase();

        return Response.json({
          clients: clients.filter(
            (client) =>
              client.name.toLowerCase().includes(lower) ||
              client.company.toLowerCase().includes(lower)
          ),
          projects: projects.filter((project) =>
            project.title.toLowerCase().includes(lower)
          ),
        });
      },
    },
  },
});
