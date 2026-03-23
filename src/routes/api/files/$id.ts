import { createFileRoute } from "@tanstack/react-router";
import { UTApi } from "uploadthing/server";
import {
  forbiddenError,
  internalServerError,
  notFoundError,
  requireSameOrigin,
  unauthorizedError,
} from "@/api/route-utils";
import { ROLES } from "@/auth/roles";
import { getSessionUserFromHeaders } from "@/auth/session.server";
import {
  canAccessProject,
  deleteProjectFileRecord,
  getProjectFileById,
  restoreProjectFileRecord,
} from "@/db/records";

const utapi = new UTApi();

export const Route = createFileRoute("/api/files/$id")({
  server: {
    handlers: {
      DELETE: async ({ params, request }) => {
        const sameOrigin = requireSameOrigin(request);

        if (!sameOrigin.ok) {
          return sameOrigin.error;
        }

        const user = await getSessionUserFromHeaders(request.headers);

        if (!user) {
          return unauthorizedError();
        }

        if (user.role !== ROLES.ADMIN) {
          return forbiddenError("Only admins can delete uploaded files.");
        }

        const existing = await getProjectFileById(params.id);

        if (!existing) {
          return notFoundError("That file could not be found.");
        }

        const hasProjectAccess = await canAccessProject(
          user,
          existing.projectId
        );

        if (!hasProjectAccess) {
          return forbiddenError("You do not have access to that file.");
        }

        const deletedRecord = await deleteProjectFileRecord(existing.id);

        if (!deletedRecord) {
          return internalServerError("The file metadata could not be deleted.");
        }

        try {
          const deletedAsset = await utapi.deleteFiles(existing.storageKey);

          if (!deletedAsset.success) {
            await restoreProjectFileRecord(deletedRecord);

            console.error("UploadThing storage deletion failed", {
              error: deletedAsset,
              fileId: existing.id,
              storageKey: existing.storageKey,
            });

            return internalServerError(
              "The uploaded file could not be removed from storage."
            );
          }
        } catch (error) {
          try {
            await restoreProjectFileRecord(deletedRecord);
          } catch (restoreError) {
            console.error("file delete rollback failed", {
              fileId: existing.id,
              restoreError,
              storageKey: existing.storageKey,
            });
          }

          console.error("UploadThing storage deletion threw", {
            error,
            fileId: existing.id,
            storageKey: existing.storageKey,
          });

          return internalServerError(
            "The uploaded file could not be removed from storage."
          );
        }

        return Response.json({ success: true });
      },
    },
  },
});
