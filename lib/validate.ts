import { ZodType } from "zod";
import { ErrorDetail, ValidationError } from "./errors";

// Replaces apps/api's validate.middleware.ts. Route Handlers parse params/query/body themselves
// (there's no middleware array to run these through first, and no Express `req.query` getter
// quirk to work around — a plain object is a plain object here), so each of these is called
// explicitly at the top of a handler and returns the validated/coerced data directly, throwing
// ValidationError (caught by lib/api-handler.ts) on failure.

export function parseBody<T>(schema: ZodType<T>, body: unknown): T {
  const result = schema.safeParse(body);
  if (!result.success) {
    throw new ValidationError("Request validation failed", toErrorDetails("body", result.error));
  }
  return result.data;
}

export function parseParams<T>(schema: ZodType<T>, params: unknown): T {
  const result = schema.safeParse(params);
  if (!result.success) {
    throw new ValidationError("Request validation failed", toErrorDetails("params", result.error));
  }
  return result.data;
}

// `searchParams` is a URLSearchParams (from `new URL(request.url).searchParams`) — converted to a
// plain object first since Zod schemas here (see lib/validation/*.schema.ts) expect one, the same
// shape Express's `req.query` gave them.
export function parseQuery<T>(schema: ZodType<T>, searchParams: URLSearchParams): T {
  const query = Object.fromEntries(searchParams.entries());
  const result = schema.safeParse(query);
  if (!result.success) {
    throw new ValidationError("Request validation failed", toErrorDetails("query", result.error));
  }
  return result.data;
}

// Converts Zod's validation error format into our own simpler ErrorDetail shape, prefixing each field path with where it came from (e.g. "body.name").
function toErrorDetails(
  scope: string,
  error: { issues: { path: PropertyKey[]; message: string }[] },
): ErrorDetail[] {
  return error.issues.map((issue) => ({
    path: [scope, ...issue.path.map(String)].join("."),
    message: issue.message,
  }));
}
