import { createFileRoute } from "@tanstack/react-router";
import {
  forbiddenError,
  notFoundError,
  parseJsonBody,
  requireSameOrigin,
  unauthorizedError,
} from "@/api/route-utils";
import { projectMilestoneSchema } from "@/api/validation";
import { ROLES } from "@/auth/roles";
import { getSessionUserFromHeaders } from "@/auth/session.server";
import {
  deleteProjectMilestoneRecord,
  serializeProjectMilestone,
  updateProjectMilestoneRecord,
} from "@/db/records";

async function requireAdminRequest(request: Request) {
  const sameOrigin = requireSameOrigin(request);

  if (!sameOrigin.ok) {
    return { error: sameOrigin.error, user: null };
  }

  const user = await getSessionUserFromHeaders(request.headers);

  if (!user) {
    return { error: unauthorizedError(), user: null };
  }

  if (user.role !== ROLES.ADMIN) {
    return {
      error: forbiddenError("Only admins can manage project milestones."),
      user: null,
    };
  }

  return { error: null, user };
}

export const Route = createFileRoute("/api/project-milestones/$id")({
  server: {
    handlers: {
      PATCH: async ({ params, request }) => {
        const auth = await requireAdminRequest(request);

        if (auth.error) {
          return auth.error;
        }

        const parsed = await parseJsonBody(request, projectMilestoneSchema);

        if (!parsed.ok) {
          return parsed.error;
        }

        const updated = await updateProjectMilestoneRecord(
          params.id,
          parsed.data
        );

        if (!updated) {
          return notFoundError("That milestone could not be found.");
        }

        return Response.json(serializeProjectMilestone(updated));
      },
      DELETE: async ({ params, request }) => {
        const auth = await requireAdminRequest(request);

        if (auth.error) {
          return auth.error;
        }

        const deleted = await deleteProjectMilestoneRecord(params.id);

        if (!deleted) {
          return notFoundError("That milestone could not be found.");
        }

        return Response.json({ success: true });
      },
    },
  },
});
