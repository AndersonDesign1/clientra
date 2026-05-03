import { loadEnvFiles } from "@/db/load-env";

loadEnvFiles();

const LOOP_TRANSACTIONAL_URL = "https://app.loops.so/api/v1/transactional";
const DEFAULT_TIMEOUT_MS = 10_000;
const TRAILING_SLASH_REGEX = /\/$/;

export type LoopTemplate =
  | "comment"
  | "fileUploaded"
  | "invite"
  | "projectUpdate";

export type LoopDataVariables = Record<string, number | string | string[]>;

export class LoopEmailError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "LoopEmailError";
  }
}

const TEMPLATE_ENV_KEYS: Record<LoopTemplate, string> = {
  comment: "LOOP_COMMENT_TEMPLATE_ID",
  fileUploaded: "LOOP_FILE_UPLOADED_TEMPLATE_ID",
  invite: "LOOP_INVITE_TEMPLATE_ID",
  projectUpdate: "LOOP_PROJECT_UPDATE_TEMPLATE_ID",
};

export function isLoopEnabled() {
  return process.env.LOOP_ENABLED !== "false";
}

function getLoopApiKey() {
  const apiKey = process.env.LOOP_API_KEY?.trim();

  if (!apiKey) {
    throw new LoopEmailError(
      "Loop email is not configured: missing LOOP_API_KEY."
    );
  }

  return apiKey;
}

function getLoopTemplateId(template: LoopTemplate) {
  const envKey = TEMPLATE_ENV_KEYS[template];
  const templateId = process.env[envKey]?.trim();

  if (!templateId) {
    throw new LoopEmailError(
      `Loop email is not configured: missing ${envKey}.`
    );
  }

  return templateId;
}

export function getAppUrl(requestUrl?: string) {
  const configuredUrl = process.env.BETTER_AUTH_URL?.trim();

  if (configuredUrl) {
    return configuredUrl.replace(TRAILING_SLASH_REGEX, "");
  }

  if (requestUrl) {
    return new URL(requestUrl).origin;
  }

  return "http://localhost:3000";
}

function createLoopPayload({
  dataVariables,
  email,
  template,
}: {
  dataVariables: LoopDataVariables;
  email: string;
  template: LoopTemplate;
}) {
  return {
    addToAudience: true,
    dataVariables,
    email,
    transactionalId: getLoopTemplateId(template),
  };
}

export async function sendTransactionalEmail({
  dataVariables,
  email,
  idempotencyKey,
  template,
  timeoutMs = DEFAULT_TIMEOUT_MS,
}: {
  dataVariables: LoopDataVariables;
  email: string;
  idempotencyKey?: string;
  template: LoopTemplate;
  timeoutMs?: number;
}) {
  if (!isLoopEnabled()) {
    throw new LoopEmailError("Loop email is disabled.");
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const headers = new Headers({
      authorization: `Bearer ${getLoopApiKey()}`,
      "content-type": "application/json",
    });

    if (idempotencyKey) {
      headers.set("idempotency-key", idempotencyKey.slice(0, 100));
    }

    const response = await fetch(LOOP_TRANSACTIONAL_URL, {
      body: JSON.stringify(
        createLoopPayload({ dataVariables, email, template })
      ),
      headers,
      method: "POST",
      signal: controller.signal,
    });
    const data = (await response.json().catch(() => null)) as {
      message?: string;
      success?: boolean;
    } | null;

    if (!response.ok || data?.success === false) {
      throw new LoopEmailError(
        data?.message ?? `Loop email failed with status ${response.status}.`
      );
    }

    return { success: true };
  } catch (error) {
    if (error instanceof LoopEmailError) {
      throw error;
    }

    if (error instanceof DOMException && error.name === "AbortError") {
      throw new LoopEmailError("Loop email request timed out.");
    }

    throw new LoopEmailError(
      error instanceof Error ? error.message : "Loop email request failed."
    );
  } finally {
    clearTimeout(timeout);
  }
}
