import {
  createRouteHandler,
  createUploadthing,
  UploadThingError,
} from "uploadthing/server";
import { z } from "zod";
import { getSessionUserFromHeaders } from "@/auth/session.server";
import { loadEnvFiles } from "@/db/load-env";
import { canAccessProject, createProjectFileRecord } from "@/db/records";

loadEnvFiles();

if (!process.env.UPLOADTHING_TOKEN) {
  throw new Error("UPLOADTHING_TOKEN is required to enable file uploads.");
}

const f = createUploadthing();

export const uploadRouter = {
  projectFiles: f(
    {
      image: {
        maxFileCount: 6,
        maxFileSize: "32MB",
      },
      pdf: {
        maxFileCount: 6,
        maxFileSize: "32MB",
      },
      text: {
        maxFileCount: 6,
        maxFileSize: "32MB",
      },
    },
    {
      awaitServerData: true,
    }
  )
    .input(
      z.object({
        projectId: z.string().min(1),
      })
    )
    .middleware(async ({ input, req }) => {
      const user = await getSessionUserFromHeaders(req.headers);

      if (!user) {
        throw new UploadThingError("You must be signed in to upload files.");
      }

      const hasAccess = await canAccessProject(user, input.projectId);

      if (!hasAccess) {
        throw new UploadThingError("You do not have access to this project.");
      }

      return {
        projectId: input.projectId,
        userId: user.id,
      };
    })
    .onUploadComplete(async ({ file, metadata }) => {
      const created = await createProjectFileRecord({
        fileName: file.name,
        fileSize: file.size,
        fileUrl: file.ufsUrl,
        id: crypto.randomUUID(),
        mimeType: file.type || "application/octet-stream",
        projectId: metadata.projectId,
        storageKey: file.key,
        uploadedBy: metadata.userId,
      });

      if (!created) {
        throw new UploadThingError("The uploaded file could not be saved.");
      }

      return {
        createdAt: created.createdAt.toISOString(),
        fileName: created.fileName,
        fileSize: created.fileSize,
        fileUrl: created.fileUrl,
        id: created.id,
        mimeType: created.mimeType,
        projectId: created.projectId,
        storageKey: created.storageKey,
        uploadedBy: created.uploadedBy,
        uploaderName: created.uploaderName,
      };
    }),
};

export type UploadRouter = typeof uploadRouter;

export const uploadthingHandler = createRouteHandler({
  router: uploadRouter,
});
