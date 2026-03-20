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
