import { createFileRoute } from "@tanstack/react-router";
import { updateUserRoleSchema } from "@/api/validation";
import { deleteUserById, setUserRole } from "@/db/records";
import {
  forbiddenError,
  notFoundError,
  parseJsonBody,
  requireAdminMutationRequest,
} from "@/server/http/route-utils";

export const Route = createFileRoute("/api/users/$id")({
  server: {
    handlers: {
      PATCH: async ({ params, request }) => {
        const auth = await requireAdminMutationRequest(request);

        if (auth.error) {
          return auth.error;
        }

        if (auth.user.id === params.id) {
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
        const auth = await requireAdminMutationRequest(request);

        if (auth.error) {
          return auth.error;
        }

        if (auth.user.id === params.id) {
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
