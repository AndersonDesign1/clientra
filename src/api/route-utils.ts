import { ZodError, type ZodType } from "zod";

interface ErrorBody {
  details?: unknown;
  error: string;
}

function jsonError(status: number, body: ErrorBody) {
  return Response.json(body, { status });
}

export async function parseJsonBody<TSchema extends ZodType>(
  request: Request,
  schema: TSchema
) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return {
      error: jsonError(400, { error: "Invalid JSON body." }),
      ok: false as const,
    };
  }

  try {
    return {
      data: schema.parse(body),
      ok: true as const,
    };
  } catch (error) {
    if (error instanceof ZodError) {
      return {
        error: jsonError(422, {
          details: error.flatten(),
          error: "Request validation failed.",
        }),
        ok: false as const,
      };
    }

    throw error;
  }
}

export function validationError(error: ZodError) {
  return jsonError(422, {
    details: error.flatten(),
    error: "Request validation failed.",
  });
}

export function internalServerError(message = "Unable to complete request.") {
  return jsonError(500, { error: message });
}

export function unauthorizedError(message = "You must be signed in.") {
  return jsonError(401, { error: message });
}

export function forbiddenError(
  message = "You do not have access to this resource."
) {
  return jsonError(403, { error: message });
}

export function tooManyRequestsError(
  message = "Too many requests. Please try again later.",
  retryAfterSeconds?: number
) {
  const headers =
    retryAfterSeconds === undefined
      ? undefined
      : {
          "retry-after": String(retryAfterSeconds),
        };

  return Response.json(
    {
      error: message,
    },
    {
      headers,
      status: 429,
    }
  );
}

export function requireSameOrigin(request: Request) {
  const requestOrigin = new URL(request.url).origin;
  const originHeader = request.headers.get("origin");
  const fetchSite = request.headers.get("sec-fetch-site");

  if (!(originHeader || fetchSite)) {
    return {
      error: forbiddenError("Missing origin information."),
      ok: false as const,
    };
  }

  if (originHeader && originHeader !== requestOrigin) {
    return {
      error: forbiddenError("Cross-site requests are not allowed."),
      ok: false as const,
    };
  }

  if (fetchSite && fetchSite !== "same-origin" && fetchSite !== "none") {
    return {
      error: forbiddenError("Cross-site requests are not allowed."),
      ok: false as const,
    };
  }

  return { ok: true as const };
}

export function notFoundError(
  message = "The requested resource was not found."
) {
  return jsonError(404, { error: message });
}
