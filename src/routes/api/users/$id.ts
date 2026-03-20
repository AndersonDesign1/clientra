import { createFileRoute } from "@tanstack/react-router";
import {
  forbiddenError,
  notFoundError,
  parseJsonBody,
  unauthorizedError,
} from "@/api/route-utils";
import { updateUserRoleSchema } from "@/api/validation";
import { ROLES } from "@/auth/roles";
import { getSessionUserFromHeaders } from "@/auth/session.server";
import { deleteUserById, setUserRole } from "@/db/records";

export const Route = createFileRoute("/api/users/$id")({
  server: {
    handlers: {
      PATCH: async ({ params, request }) => {
        const user = await getSessionUserFromHeaders(request.headers);

        if (!user) {
          return unauthorizedError();
        }

        if (user.role !== ROLES.ADMIN) {
          return forbiddenError();
        }

        if (user.id === params.id) {
          return forbiddenError("You cannot change your own role.");
        }

        const parsed = await parseJsonBody(request, updateUserRoleSchema);

        if (!parsed.ok) {
          return parsed.error;
        }

        const updated = await setUserRole(params.id, parsed.data.role);

        if (!updated) {
          return notFoundError("That user could not be found.");
        }

        return Response.json(updated);
      },
      DELETE: async ({ params, request }) => {
        const user = await getSessionUserFromHeaders(request.headers);

        if (!user) {
          return unauthorizedError();
        }

        if (user.role !== ROLES.ADMIN) {
          return forbiddenError();
        }

        if (user.id === params.id) {
          return forbiddenError("You cannot delete your own account.");
        }

        const deleted = await deleteUserById(params.id);

        if (!deleted) {
          return notFoundError("That user could not be found.");
        }

        return Response.json({ success: true });
      },
    },
  },
});
