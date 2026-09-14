import { NextResponse } from "next/server";
import { Prisma } from "./db";
import logger from "./logger";
import { AppError } from "./errors";

// Replaces apps/api's error.middleware.ts (Express's central error handler) — Route Handlers have
// no shared middleware chain to funnel thrown errors through, so every route handler is wrapped in
// this instead: `export const GET = withApiHandler(async (request) => { ... })`. Any error thrown
// inside is caught here and turned into the exact same `{success:false,error:{code,message,details?}}`
// JSON shape the old Express API sent, so lib/api-client.ts on the frontend needs no changes.
export function withApiHandler<Args extends unknown[]>(
  handler: (request: Request, ...args: Args) => Promise<NextResponse>,
): (request: Request, ...args: Args) => Promise<NextResponse> {
  return async (request, ...args) => {
    try {
      return await handler(request, ...args);
    } catch (err) {
      return toErrorResponse(err);
    }
  };
}

function toErrorResponse(err: unknown): NextResponse {
  // If the error is one of our custom errors, use the status code and message it already provides.
  if (err instanceof AppError) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: err.code,
          message: err.message,
          ...(err.details ? { details: err.details } : {}),
        },
      },
      { status: err.statusCode },
    );
  }

  // Translate known database errors from Prisma into user-friendly API responses.
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    // P2002: tried to insert a duplicate value where uniqueness is required.
    if (err.code === "P2002") {
      return NextResponse.json(
        { success: false, error: { code: "CONFLICT", message: "A resource with this value already exists" } },
        { status: 409 },
      );
    }

    // P2025: tried to update/delete a record that doesn't exist.
    if (err.code === "P2025") {
      return NextResponse.json(
        { success: false, error: { code: "NOT_FOUND", message: "Resource not found" } },
        { status: 404 },
      );
    }

    // P2003: violated a foreign key relationship (e.g. linked record still in use).
    if (err.code === "P2003") {
      return NextResponse.json(
        {
          success: false,
          error: { code: "CONFLICT", message: "This operation violates a data relationship constraint" },
        },
        { status: 409 },
      );
    }
  }

  // Anything else is unexpected, so log it for debugging and send a generic 500 response.
  logger.error({ err }, "Unhandled error");
  return NextResponse.json(
    { success: false, error: { code: "INTERNAL_ERROR", message: "An unexpected error occurred" } },
    { status: 500 },
  );
}
