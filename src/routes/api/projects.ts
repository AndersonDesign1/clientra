import { createFileRoute } from "@tanstack/react-router";
import {
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
  listProjectsForUser,
  seedIfEmpty,
} from "@/db/records";

export const Route = createFileRoute("/api/projects")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        await seedIfEmpty();
        const user = await getSessionUserFromHeaders(request.headers);

        if (!user) {
          return unauthorizedError();
        }

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
