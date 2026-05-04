import type { SessionUser } from "@/auth/roles";
import {
  getAppUrl,
  isLoopEnabled,
  type LoopDataVariables,
  type LoopTemplate,
  sendTransactionalEmail,
} from "./loop";

export interface NotificationRecipient {
  email: string;
  id: string;
  name: string;
  role: "admin" | "client";
}

export interface ProjectNotificationContext {
  clientCompany: string;
  clientName: string;
  discussionUrl: string;
  projectId: string;
  projectTitle: string;
  projectUrl: string;
  recipients: NotificationRecipient[];
}

function truncatePreview(value: string, maxLength = 220) {
  const normalized = value.replace(/\s+/g, " ").trim();

  if (normalized.length <= maxLength) {
    return normalized;
  }

  return `${normalized.slice(0, maxLength - 3)}...`;
}

export function filterNotificationRecipients(
  recipients: NotificationRecipient[],
  actorId?: string
) {
  const seenEmails = new Set<string>();

  return recipients.filter((recipient) => {
    const normalizedEmail = recipient.email.trim().toLowerCase();

    if (!(normalizedEmail && recipient.id !== actorId)) {
      return false;
    }

    if (seenEmails.has(normalizedEmail)) {
      return false;
    }

    seenEmails.add(normalizedEmail);
    return true;
  });
}

async function sendToRecipients({
  actor,
  context,
  dataVariables,
  idempotencyKeyPrefix,
  template,
}: {
  actor: SessionUser;
  context: ProjectNotificationContext;
  dataVariables: LoopDataVariables;
  idempotencyKeyPrefix: string;
  template: Exclude<LoopTemplate, "invite">;
}) {
  const recipients = filterNotificationRecipients(context.recipients, actor.id);
  const appUrl = getAppUrl();

  const results = await Promise.allSettled(
    recipients.map((recipient) =>
      sendTransactionalEmail({
        dataVariables: {
          ...dataVariables,
          actorName: actor.name,
          appUrl,
          clientCompany: context.clientCompany,
          clientName: context.clientName,
          discussionUrl: context.discussionUrl,
          preferenceUrl: `${appUrl}/settings`,
          projectTitle: context.projectTitle,
          projectUrl: context.projectUrl,
          recipientEmail: recipient.email,
          recipientName: recipient.name,
        },
        email: recipient.email,
        idempotencyKey: `${idempotencyKeyPrefix}:${recipient.id}`,
        template,
      })
    )
  );

  for (const [index, result] of results.entries()) {
    if (result.status === "rejected") {
      const recipient = recipients[index];

      console.error("Loop notification failed for recipient", {
        error: result.reason,
        eventType: template,
        projectId: context.projectId,
        recipientId: recipient.id,
      });
    }
  }
}

export async function notifyProjectUpdate({
  actor,
  context,
  updateBody,
  updateId,
  updateStatus,
  updateTitle,
}: {
  actor: SessionUser;
  context: ProjectNotificationContext;
  updateBody: string;
  updateId: string;
  updateStatus: string;
  updateTitle: string;
}) {
  await sendToRecipients({
    actor,
    context,
    dataVariables: {
      updatePreview: truncatePreview(updateBody),
      updateStatus,
      updateTitle,
    },
    idempotencyKeyPrefix: `project-update:${updateId}`,
    template: "projectUpdate",
  });
}

export async function notifyFileUploaded({
  actor,
  context,
  fileId,
  fileName,
}: {
  actor: SessionUser;
  context: ProjectNotificationContext;
  fileId: string;
  fileName: string;
}) {
  await sendToRecipients({
    actor,
    context,
    dataVariables: { fileName },
    idempotencyKeyPrefix: `file-uploaded:${fileId}`,
    template: "fileUploaded",
  });
}

export async function notifyProjectComment({
  actor,
  commentId,
  commentPreview,
  context,
}: {
  actor: SessionUser;
  commentId: string;
  commentPreview: string;
  context: ProjectNotificationContext;
}) {
  await sendToRecipients({
    actor,
    context,
    dataVariables: { commentPreview: truncatePreview(commentPreview) },
    idempotencyKeyPrefix: `comment:${commentId}`,
    template: "comment",
  });
}

export async function sendInviteEmail({
  clientCompany,
  clientName,
  email,
  inviteId,
  inviteUrl,
  requestUrl,
}: {
  clientCompany: string;
  clientName: string;
  email: string;
  inviteId: string;
  inviteUrl: string;
  requestUrl: string;
}) {
  if (!isLoopEnabled()) {
    return { skipped: true };
  }

  await sendTransactionalEmail({
    dataVariables: {
      appUrl: getAppUrl(requestUrl),
      clientCompany,
      clientName,
      inviteUrl,
      recipientEmail: email,
    },
    email,
    idempotencyKey: `invite:${inviteId}`,
    template: "invite",
  });

  return { skipped: false };
}

export function logNotificationFailure(eventType: string, error: unknown) {
  console.error("Loop notification failed", {
    error,
    eventType,
  });
}
