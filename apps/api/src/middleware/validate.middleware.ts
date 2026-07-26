import { NextFunction, Request, Response } from "express";
import { ZodType } from "zod";
import { ErrorDetail, ValidationError } from "../lib/errors";

// The Zod schemas for a route can provide to validate each part of the request.
interface ValidateSchemas {
  body?: ZodType;
  params?: ZodType;
  query?: ZodType;
}

// A middleware factory which gives Zod schemas for params/query/body, and it returns a middleware that checks the incoming request against them before letting the route handler run.

export function validate(schemas: ValidateSchemas) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const details: ErrorDetail[] = [];

    // Validate URL params (e.g. :id) if a schema was given for them.
    if (schemas.params) {
      const result = schemas.params.safeParse(req.params);

      if (result.success) {
        Object.assign(req.params, result.data); // Assigns the validated properties from result.data to req.params.
      } else {
        details.push(...toErrorDetails("params", result.error));
      }
    }

    // Validate query string params (e.g. ?limit=10) if a schema was given for them.
    if (schemas.query) {
      const result = schemas.query.safeParse(req.query);

      if (result.success) {
        /*
        
        - Express 5's `req.query` is a getter that re-parses the raw query string on every access (it does not cache), so mutating the object it returns is silently discarded. Replace the getter with a plain value so downstream reads see the validated/coerced data.
        
        - Express 5 ignores direct edits to `req.query`. So, overwriting it with a plain object ensures the rest of the app sees our validated data.
        
        */

        Object.defineProperty(req, "query", {
          value: result.data, // Assigns the validated properties from result.data to req.query.

          writable: true, // Allows req.query to be reassigned.
          configurable: true, // Allows the property to be redefined or deleted.

          enumerable: true, // Allows req.query to be iterated over.
        });
      } else {
        details.push(...toErrorDetails("query", result.error));
      }
    }

    // Validate the request body (e.g. JSON payload) if a schema was given for it.
    if (schemas.body) {
      const result = schemas.body.safeParse(req.body);
      if (result.success) {
        req.body = result.data; // Assigns the validated properties from result.data to req.body.
      } else {
        details.push(...toErrorDetails("body", result.error));
      }
    }

    // If any part failed validation, stop here and report all the problems at once.
    if (details.length > 0) {
      next(new ValidationError("Request validation failed", details));
      return;
    }

    next();
  };
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
