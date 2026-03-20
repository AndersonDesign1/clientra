import { createFileRoute } from "@tanstack/react-router";
import { UTApi } from "uploadthing/server";
import {
  forbiddenError,
  internalServerError,
  notFoundError,
  unauthorizedError,
} from "@/api/route-utils";
import { ROLES } from "@/auth/roles";
import { getSessionUserFromHeaders } from "@/auth/session.server";
import { deleteProjectFileRecord, getProjectFileById } from "@/db/records";

const utapi = new UTApi();

export const Route = createFileRoute("/api/files/$id")({
  server: {
    handlers: {
      DELETE: async ({ params, request }) => {
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

        const deletedRecord = await deleteProjectFileRecord(existing.id);

        if (!deletedRecord) {
          return internalServerError("The file metadata could not be deleted.");
        }

        try {
          const deletedAsset = await utapi.deleteFiles(existing.storageKey);

          if (!deletedAsset.success) {
            console.error("UploadThing storage deletion failed", {
              error: deletedAsset,
              fileId: existing.id,
              storageKey: existing.storageKey,
            });

            return internalServerError(
              "The file metadata was removed, but storage cleanup failed."
            );
          }

          return Response.json({ success: true });
        } catch (error) {
          console.error("UploadThing storage deletion threw", {
            error,
            fileId: existing.id,
            storageKey: existing.storageKey,
          });

          return internalServerError(
            "The file metadata was removed, but storage cleanup failed."
          );
        }
      },
    },
  },
});
