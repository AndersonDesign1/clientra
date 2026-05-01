import { createFileRoute } from "@tanstack/react-router";
import { UTApi } from "uploadthing/server";
import { updateClientSchema } from "@/api/validation";
import {
  deleteClientRecord,
  listClientStorageKeys,
  updateClientRecord,
} from "@/db/records";
import {
  notFoundError,
  parseJsonBody,
  requireAdminMutationRequest,
} from "@/server/http/route-utils";

const utapi = new UTApi();

async function deleteFilesFromStorage(storageKeys: string[]) {
  if (storageKeys.length === 0) {
    return;
  }

  try {
    const deleted = await utapi.deleteFiles(storageKeys);

    if (!deleted.success) {
      console.error("UploadThing client file cleanup failed", {
        deleted,
        storageKeys,
      });
    }
  } catch (error) {
    console.error("UploadThing client file cleanup threw", {
      error,
      storageKeys,
    });
  }
}

export const Route = createFileRoute("/api/clients/$id")({
  server: {
    handlers: {
      PATCH: async ({ params, request }) => {
        const auth = await requireAdminMutationRequest(request);

        if (auth.error) {
          return auth.error;
        }

        const parsed = await parseJsonBody(request, updateClientSchema);

        if (!parsed.ok) {
          return parsed.error;
        }

        const updated = await updateClientRecord(params.id, {
          ...parsed.data,
          id: params.id,
        });

        if (!updated) {
          return notFoundError("That client could not be found.");
        }

        return Response.json(updated);
      },
      DELETE: async ({ params, request }) => {
        const auth = await requireAdminMutationRequest(request);

        if (auth.error) {
          return auth.error;
        }

        const storageKeys = await listClientStorageKeys(params.id);
        const deleted = await deleteClientRecord(params.id);

        if (!deleted) {
          return notFoundError("That client could not be found.");
        }

        await deleteFilesFromStorage(storageKeys);

        return Response.json({ success: true });
      },
    },
  },
});
