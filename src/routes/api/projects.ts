import { createFileRoute } from "@tanstack/react-router";
import { createProjectSchema } from "@/api/validation";
import { getSessionUserFromHeaders } from "@/auth/session.server";
import {
  adminOwnsClient,
  createProjectRecord,
  DuplicateProjectSlugError,
  listProjectsForUser,
} from "@/db/records";
import {
  conflictError,
  internalServerError,
  notFoundError,
  parseJsonBody,
  requireAdminMutationRequest,
  unauthorizedError,
} from "@/server/http/route-utils";

export const Route = createFileRoute("/api/projects")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const user = await getSessionUserFromHeaders(request.headers);

        if (!user) {
          return unauthorizedError();
        }

        return Response.json(await listProjectsForUser(user));
      },
      POST: async ({ request }) => {
        const auth = await requireAdminMutationRequest(request);

        if (auth.error) {
          return auth.error;
        }

        const parsed = await parseJsonBody(request, createProjectSchema);

        if (!parsed.ok) {
          return parsed.error;
        }

        if (!(await adminOwnsClient(auth.user, parsed.data.clientId))) {
          return notFoundError("We could not find a client with that id.");
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
