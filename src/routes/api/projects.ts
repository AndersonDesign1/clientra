import { createFileRoute } from "@tanstack/react-router";
import { createProjectSchema } from "@/api/validation";
import { projects } from "@/features/projects/mock-data";

export const Route = createFileRoute("/api/projects")({
  server: {
    handlers: {
      GET: () => {
        return Response.json(projects);
      },
      POST: async ({ request }) => {
        const body = await request.json();
        const project = createProjectSchema.parse(body);
        return Response.json(project);
      },
    },
  },
});
