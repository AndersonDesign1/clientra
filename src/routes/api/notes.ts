import { createFileRoute } from "@tanstack/react-router";
import { createNoteSchema } from "@/api/validation";

export const Route = createFileRoute("/api/notes")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const body = await request.json();
        const note = createNoteSchema.parse(body);
        return Response.json(note);
      },
    },
  },
});
