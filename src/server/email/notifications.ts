import type { SessionUser } from "@/auth/roles";
import {
  getAppUrl,
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
  projectId: string;
  projectTitle: string;
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

  await Promise.all(
    recipients.map((recipient) =>
      sendTransactionalEmail({
        dataVariables: {
          ...dataVariables,
          actorName: actor.name,
          appUrl: getAppUrl(),
          clientCompany: context.clientCompany,
          clientName: context.clientName,
          projectTitle: context.projectTitle,
          recipientEmail: recipient.email,
          recipientName: recipient.name,
        },
        email: recipient.email,
        idempotencyKey: `${idempotencyKeyPrefix}:${recipient.id}`,
        template,
      })
    )
  );
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

export function logNotificationFailure(eventType: string, error: unknown) {
  console.error("Loop notification failed", {
    error,
    eventType,
  });
}
