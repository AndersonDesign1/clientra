import { createFileRoute } from "@tanstack/react-router";
import { UTApi } from "uploadthing/server";
import {
  canAccessProject,
  deleteProjectFileRecord,
  getProjectFileById,
  restoreProjectFileRecord,
} from "@/db/records";
import {
  forbiddenError,
  internalServerError,
  notFoundError,
  requireAdminMutationRequest,
} from "@/server/http/route-utils";

const utapi = new UTApi();

export const Route = createFileRoute("/api/files/$id")({
  server: {
    handlers: {
      DELETE: async ({ params, request }) => {
        const auth = await requireAdminMutationRequest(
          request,
          "Only admins can delete uploaded files."
        );

        if (auth.error) {
          return auth.error;
        }

        const existing = await getProjectFileById(params.id);

        if (!existing) {
          return notFoundError("That file could not be found.");
        }

        const hasProjectAccess = await canAccessProject(
          auth.user,
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
