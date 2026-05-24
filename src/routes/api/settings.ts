import { createFileRoute } from "@tanstack/react-router";
import { getSessionUserFromHeaders } from "@/auth/session.server";
import {
  getWorkspaceSettings,
  updateWorkspaceSettings,
  type WorkspaceSettingsPatch,
} from "@/db/records";
import {
  notFoundError,
  parseJsonBody,
  requireAdminMutationRequest,
  unauthorizedError,
} from "@/server/http/route-utils";
import { z } from "zod";

const updateSettingsSchema = z.object({
  workspaceName: z.string().min(1).max(100).optional(),
  supportEmail: z.string().email().optional(),
  allowSignups: z.boolean().optional(),
  enableNotifications: z.boolean().optional(),
  autoArchive: z.boolean().optional(),
  portalUrl: z.string().url().nullable().optional(),
  logoUrl: z.string().url().nullable().optional(),
}) satisfies z.ZodType<Partial<WorkspaceSettingsPatch>>;

export const Route = createFileRoute("/api/settings")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const user = await getSessionUserFromHeaders(request.headers);

        if (!user) {
          return unauthorizedError();
        }

        try {
          const settings = await getWorkspaceSettings();
          return Response.json(settings);
        } catch (error) {
          console.error("Failed to get workspace settings:", error);
          return notFoundError("Settings not found");
        }
      },
      PATCH: async ({ request }) => {
        const auth = await requireAdminMutationRequest(request);

        if (auth.error) {
          return auth.error;
        }

        const parsed = await parseJsonBody(request, updateSettingsSchema);

        if (!parsed.ok) {
          return parsed.error;
        }

        try {
          const updated = await updateWorkspaceSettings(parsed.data);
          return Response.json(updated);
        } catch (error) {
          console.error("Failed to update workspace settings:", error);
          return notFoundError("Failed to update settings");
        }
      },
    },
  },
});
