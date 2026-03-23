import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { getActiveInviteByToken, hasWorkspaceAdmin } from "@/db/records";
import { maskEmailAddress } from "@/lib/email";

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

    if (!invite) {
      return null;
    }

    return {
      expiresAt: invite.expiresAt.toISOString(),
      maskedEmail: maskEmailAddress(invite.email),
    };
  });
