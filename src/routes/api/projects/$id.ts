import { createFileRoute } from "@tanstack/react-router";
import { UTApi } from "uploadthing/server";
import {
  conflictError,
  forbiddenError,
  notFoundError,
  parseJsonBody,
  requireSameOrigin,
  unauthorizedError,
} from "@/api/route-utils";
import { updateProjectSchema } from "@/api/validation";
import { ROLES } from "@/auth/roles";
import { getSessionUserFromHeaders } from "@/auth/session.server";
import {
  DuplicateProjectSlugError,
  deleteProjectRecord,
  listProjectStorageKeys,
  updateProjectRecord,
} from "@/db/records";

const utapi = new UTApi();

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
    return { error: forbiddenError(), user: null };
  }

  return { error: null, user };
}

async function deleteFilesFromStorage(storageKeys: string[]) {
  if (storageKeys.length === 0) {
    return;
  }

  try {
    const deleted = await utapi.deleteFiles(storageKeys);

    if (!deleted.success) {
      console.error("UploadThing project file cleanup failed", {
        deleted,
        storageKeys,
      });
    }
  } catch (error) {
    console.error("UploadThing project file cleanup threw", {
      error,
      storageKeys,
    });
  }
}

export const Route = createFileRoute("/api/projects/$id")({
  server: {
    handlers: {
      PATCH: async ({ params, request }) => {
        const auth = await requireAdminRequest(request);

        if (auth.error) {
          return auth.error;
        }

        const parsed = await parseJsonBody(request, updateProjectSchema);

        if (!parsed.ok) {
          return parsed.error;
        }

        let updated: Awaited<ReturnType<typeof updateProjectRecord>>;

        try {
          updated = await updateProjectRecord(params.id, {
            ...parsed.data,
            id: params.id,
          });
        } catch (error) {
          if (error instanceof DuplicateProjectSlugError) {
            return conflictError(error.message);
          }

          throw error;
        }

        if (!updated) {
          return notFoundError("That project could not be found.");
        }

        return Response.json(updated);
      },
      DELETE: async ({ params, request }) => {
        const auth = await requireAdminRequest(request);

        if (auth.error) {
          return auth.error;
        }

        const storageKeys = await listProjectStorageKeys(params.id);
        const deleted = await deleteProjectRecord(params.id);

        if (!deleted) {
          return notFoundError("That project could not be found.");
        }

        await deleteFilesFromStorage(storageKeys);

        return Response.json({ success: true });
      },
    },
  },
});
