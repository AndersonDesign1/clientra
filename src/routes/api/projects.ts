import { createFileRoute } from "@tanstack/react-router";
import { internalServerError, parseJsonBody } from "@/api/route-utils";
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
        const parsed = await parseJsonBody(request, createProjectSchema);

        if (!parsed.ok) {
          return parsed.error;
        }

        const created = await createProjectRecord({
          ...parsed.data,
          id: crypto.randomUUID(),
        });

        if (!created) {
          return internalServerError(
            "Project was created but could not be reloaded."
          );
        }

        return Response.json(created, { status: 201 });
      },
    },
  },
});
