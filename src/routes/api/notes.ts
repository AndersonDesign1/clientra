import { createFileRoute } from "@tanstack/react-router";
import { internalServerError, parseJsonBody } from "@/api/route-utils";
import { createNoteSchema } from "@/api/validation";
import { createProjectNoteRecord } from "@/db/records";

export const Route = createFileRoute("/api/notes")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const parsed = await parseJsonBody(request, createNoteSchema);

        if (!parsed.ok) {
          return parsed.error;
        }

        const created = await createProjectNoteRecord({
          ...parsed.data,
          id: crypto.randomUUID(),
        });

        if (!created) {
          return internalServerError(
            "Note was created but could not be reloaded."
          );
        }

        return Response.json(created, { status: 201 });
      },
    },
  },
});
