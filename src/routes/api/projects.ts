import { createFileRoute } from "@tanstack/react-router";
import {
  conflictError,
  forbiddenError,
  internalServerError,
  parseJsonBody,
  requireSameOrigin,
  unauthorizedError,
} from "@/api/route-utils";
import { createProjectSchema } from "@/api/validation";
import { ROLES } from "@/auth/roles";
import { getSessionUserFromHeaders } from "@/auth/session.server";
import {
  createProjectRecord,
  DuplicateProjectSlugError,
  listProjectsForUser,
  seedIfEmpty,
} from "@/db/records";

export const Route = createFileRoute("/api/projects")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const user = await getSessionUserFromHeaders(request.headers);

        if (!user) {
          return unauthorizedError();
        }

        await seedIfEmpty();

        return Response.json(await listProjectsForUser(user));
      },
      POST: async ({ request }) => {
        const sameOrigin = requireSameOrigin(request);

        if (!sameOrigin.ok) {
          return sameOrigin.error;
        }

        const user = await getSessionUserFromHeaders(request.headers);

        if (!user) {
          return unauthorizedError();
        }

        if (user.role !== ROLES.ADMIN) {
          return forbiddenError();
        }

        const parsed = await parseJsonBody(request, createProjectSchema);

        if (!parsed.ok) {
          return parsed.error;
        }

        let created: Awaited<ReturnType<typeof createProjectRecord>>;

        try {
          created = await createProjectRecord({
            ...parsed.data,
            id: crypto.randomUUID(),
          });
        } catch (error) {
          if (error instanceof DuplicateProjectSlugError) {
            return conflictError(error.message);
          }

          throw error;
        }

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
