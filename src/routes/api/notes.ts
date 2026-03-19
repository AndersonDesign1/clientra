import { createFileRoute } from "@tanstack/react-router";
import { createNoteSchema } from "@/api/validation";
import { createProjectNoteRecord } from "@/db/records";

export const Route = createFileRoute("/api/notes")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const body = await request.json();
        const note = createNoteSchema.parse(body);
        const created = await createProjectNoteRecord({
          ...note,
          id: crypto.randomUUID(),
        });
        return Response.json(created, { status: 201 });
      },
    },
  },
});
