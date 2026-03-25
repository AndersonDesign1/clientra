import { createFileRoute } from "@tanstack/react-router";
import { ZodError } from "zod";
import { unauthorizedError, validationError } from "@/api/route-utils";
import { searchSchema } from "@/api/validation";
import { getSessionUserFromHeaders } from "@/auth/session.server";
import { searchRecords, seedIfEmpty } from "@/db/records";

export const Route = createFileRoute("/api/search")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const user = await getSessionUserFromHeaders(request.headers);

        if (!user) {
          return unauthorizedError();
        }

        const url = new URL(request.url);
        let query = "";

        try {
          ({ query } = searchSchema.parse({
            query: url.searchParams.get("query") ?? "",
          }));
        } catch (error) {
          if (error instanceof ZodError) {
            return validationError(error);
          }

          throw error;
        }

        if (!query) {
          return Response.json({ clients: [], projects: [] });
        }

        await seedIfEmpty();
        return Response.json(await searchRecords(query, user));
      },
    },
  },
});
