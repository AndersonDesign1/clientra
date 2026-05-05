import {
  createRouteHandler,
  createUploadthing,
  UploadThingError,
  UTApi,
} from "uploadthing/server";
import { z } from "zod";
import { getSessionUserFromHeaders } from "@/auth/session.server";
import { loadEnvFiles } from "@/db/load-env";
import {
  canAccessProject,
  createProjectFileRecord,
  getProjectNotificationContext,
  serializeProjectFile,
} from "@/db/records";
import {
  logNotificationFailure,
  notifyFileUploaded,
} from "@/server/email/notifications";

loadEnvFiles();

const f = createUploadthing();
const maxFilesPerUpload = 6;
const utapi = new UTApi();

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
    .middleware(async ({ files, input, req }) => {
      if (!process.env.UPLOADTHING_TOKEN) {
        throw new UploadThingError(
          "File uploads are not configured. Set the UPLOADTHING_TOKEN environment variable."
        );
      }

      const user = await getSessionUserFromHeaders(req.headers);

      if (!user) {
        throw new UploadThingError("You must be signed in to upload files.");
      }

      const hasAccess = await canAccessProject(user, input.projectId);

      if (!hasAccess) {
        throw new UploadThingError("You do not have access to this project.");
      }

      if (files.length > maxFilesPerUpload) {
        throw new UploadThingError(
          `You can upload up to ${maxFilesPerUpload} files at a time.`
        );
      }

      return {
        userEmail: user.email,
        projectId: input.projectId,
        userId: user.id,
        userName: user.name,
        userRole: user.role,
      };
    })
    .onUploadComplete(async ({ file, metadata }) => {
      let created: Awaited<ReturnType<typeof createProjectFileRecord>> = null;

      try {
        created = await createProjectFileRecord({
          fileName: file.name,
          fileSize: file.size,
          fileUrl: file.ufsUrl,
          id: crypto.randomUUID(),
          mimeType: file.type || "application/octet-stream",
          projectId: metadata.projectId,
          storageKey: file.key,
          uploadedBy: metadata.userId,
        });
      } catch (error) {
        try {
          await utapi.deleteFiles(file.key);
        } catch (cleanupError) {
          console.error("UploadThing cleanup failed after DB insert error", {
            cleanupError,
            fileKey: file.key,
          });
        }

        console.error("Failed to persist uploaded file metadata", {
          error,
          fileKey: file.key,
          projectId: metadata.projectId,
          userId: metadata.userId,
        });
        throw new UploadThingError("The uploaded file could not be saved.");
      }

      if (!created) {
        try {
          await utapi.deleteFiles(file.key);
        } catch (cleanupError) {
          console.error("UploadThing cleanup failed after empty DB result", {
            cleanupError,
            fileKey: file.key,
          });
        }

        throw new UploadThingError("The uploaded file could not be saved.");
      }

      let notificationContext: Awaited<
        ReturnType<typeof getProjectNotificationContext>
      > = null;

      try {
        notificationContext = await getProjectNotificationContext(
          metadata.projectId
        );
      } catch (error) {
        logNotificationFailure("file_uploaded_context", error);
      }

      if (notificationContext) {
        notifyFileUploaded({
          actor: {
            email: metadata.userEmail,
            id: metadata.userId,
            name: metadata.userName,
            role: metadata.userRole,
          },
          context: notificationContext,
          fileId: created.id,
          fileName: created.fileName,
        }).catch((error) => logNotificationFailure("file_uploaded", error));
      }

      return serializeProjectFile(created);
    }),
};

export type UploadRouter = typeof uploadRouter;

export const uploadthingHandler = createRouteHandler({
  router: uploadRouter,
});
