import { maskEmailAddress } from "./email";

export function serializeInvitePreview(invite: {
  email: string;
  expiresAt: Date;
}) {
  return {
    expiresAt: invite.expiresAt.toISOString(),
    maskedEmail: maskEmailAddress(invite.email),
  };
}
