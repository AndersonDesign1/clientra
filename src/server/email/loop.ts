import { LoopsClient } from "loops";
import { loadEnvFiles } from "@/db/load-env";

loadEnvFiles();

const DEFAULT_TIMEOUT_MS = 10_000;
const TRAILING_SLASH_REGEX = /\/$/;

export type LoopTemplate =
  | "comment"
  | "fileUploaded"
  | "invite"
  | "projectUpdate"
  | "resetPassword"
  | "verifyEmail";

export type LoopDataVariables = Record<
  string,
  Record<string, number | string>[] | number | string
>;

export class LoopEmailError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "LoopEmailError";
  }
}

const TEMPLATE_ENV_KEYS: Record<
  LoopTemplate,
  { fallback?: string; primary: string }
> = {
  comment: {
    fallback: "LOOP_COMMENT_TEMPLATE_ID",
    primary: "LOOPS_COMMENT_TRANSACTIONAL_ID",
  },
  fileUploaded: {
    fallback: "LOOP_FILE_UPLOADED_TEMPLATE_ID",
    primary: "LOOPS_FILE_UPLOADED_TRANSACTIONAL_ID",
  },
  invite: {
    fallback: "LOOP_INVITE_TEMPLATE_ID",
    primary: "LOOPS_INVITE_TRANSACTIONAL_ID",
  },
  projectUpdate: {
    fallback: "LOOP_PROJECT_UPDATE_TEMPLATE_ID",
    primary: "LOOPS_PROJECT_UPDATE_TRANSACTIONAL_ID",
  },
  resetPassword: {
    primary: "LOOPS_RESET_PASSWORD_TRANSACTIONAL_ID",
  },
  verifyEmail: {
    primary: "LOOPS_VERIFY_EMAIL_TRANSACTIONAL_ID",
  },
};

export function isLoopEnabled() {
  return (
    (
      firstConfiguredValue(
        process.env.LOOPS_ENABLED,
        process.env.LOOP_ENABLED
      ) ?? "true"
    ).toLowerCase() !== "false"
  );
}

function firstConfiguredValue(...values: Array<string | undefined>) {
  return values.map((value) => value?.trim()).find(Boolean);
}

function getLoopApiKey() {
  const apiKey = firstConfiguredValue(
    process.env.LOOPS_API_KEY,
    process.env.LOOP_API_KEY
  );

  if (!apiKey) {
    throw new LoopEmailError(
      "Loops email is not configured: missing LOOPS_API_KEY."
    );
  }

  return apiKey;
}

function getLoopTemplateId(template: LoopTemplate) {
  const { fallback, primary } = TEMPLATE_ENV_KEYS[template];
  const templateId = firstConfiguredValue(
    process.env[primary],
    fallback ? process.env[fallback] : undefined
  );

  if (!templateId) {
    throw new LoopEmailError(
      `Loops email is not configured: missing ${primary}.`
    );
  }

  return templateId;
}

function getLoopsClient() {
  return new LoopsClient(getLoopApiKey());
}

export function getAppUrl(requestUrl?: string) {
  const configuredUrl = process.env.BETTER_AUTH_URL?.trim();

  if (configuredUrl) {
    return configuredUrl.replace(TRAILING_SLASH_REGEX, "");
  }

  if (requestUrl) {
    try {
      return new URL(requestUrl).origin;
    } catch (error) {
      console.error("Invalid request URL for Loops app URL fallback", {
        error,
      });
    }
  }

  return "http://localhost:3000";
}

function createLoopsPayload({
  dataVariables,
  email,
  idempotencyKey,
  template,
}: {
  dataVariables: LoopDataVariables;
  email: string;
  idempotencyKey?: string;
  template: LoopTemplate;
}) {
  return {
    addToAudience: template === "invite",
    dataVariables,
    email,
    headers: idempotencyKey
      ? { "Idempotency-Key": idempotencyKey.slice(0, 100) }
      : undefined,
    transactionalId: getLoopTemplateId(template),
  };
}

function withTimeout<T>(promise: Promise<T>, timeoutMs: number) {
  let timeout: ReturnType<typeof setTimeout>;

  const timeoutPromise = new Promise<never>((_, reject) => {
    timeout = setTimeout(
      () => reject(new LoopEmailError("Loops email request timed out.")),
      timeoutMs
    );
  });

  return Promise.race([promise, timeoutPromise]).finally(() =>
    clearTimeout(timeout)
  );
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
    throw new LoopEmailError("Loops email is disabled.");
  }

  try {
    const response = await withTimeout(
      getLoopsClient().sendTransactionalEmail(
        createLoopsPayload({ dataVariables, email, idempotencyKey, template })
      ),
      timeoutMs
    );

    if (!response.success) {
      throw new LoopEmailError("Loops transactional email failed.");
    }

    return { success: true };
  } catch (error) {
    if (error instanceof LoopEmailError) {
      throw error;
    }
    throw new LoopEmailError(
      error instanceof Error ? error.message : "Loops email request failed."
    );
  }
}
