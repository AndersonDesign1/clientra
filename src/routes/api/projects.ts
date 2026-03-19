import { createFileRoute } from "@tanstack/react-router";
import { createProjectSchema } from "@/api/validation";
import { createProjectRecord, listProjects, seedIfEmpty } from "@/db/records";

export const Route = createFileRoute("/api/projects")({
  server: {
    handlers: {
      GET: async () => {
        await seedIfEmpty();
        return Response.json(await listProjects());
      },
      POST: async ({ request }) => {
        const body = await request.json();
        const project = createProjectSchema.parse(body);
        const created = await createProjectRecord({
          ...project,
          id: crypto.randomUUID(),
        });
        return Response.json(created, { status: 201 });
      },
    },
  },
});
