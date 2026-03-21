import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { getActiveInviteByToken, hasWorkspaceAdmin } from "@/db/records";

const inviteTokenSchema = z.object({
  token: z.string().trim().min(1).max(255),
});

export const getAdminSignupAvailability = createServerFn({
  method: "GET",
})
  .inputValidator((input: unknown) => input)
  .handler(async () => ({
    isOpen: !(await hasWorkspaceAdmin()),
  }));

export const getInvitePreview = createServerFn({
  method: "GET",
})
  .inputValidator(inviteTokenSchema)
  .handler(async ({ data }) => {
    const invite = await getActiveInviteByToken(data.token);

    if (!invite || invite.expiresAt.getTime() < Date.now()) {
      return null;
    }

    return {
      email: invite.email,
      expiresAt: invite.expiresAt.toISOString(),
    };
  });
