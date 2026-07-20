import { NextFunction, Request, Response } from "express";
import { Prisma } from "@repo/database";
import logger from "../config/logger";
import { AppError } from "../lib/errors";

// Express's central error handler — every "next(err)" call in the app ends up here, and this function decides what status/JSON to send back.

export function errorMiddleware(
  err: unknown,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  next: NextFunction,
): void {
  // If we threw one of our own custom errors, use the status/code/message it already carries.
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      success: false,
      error: {
        code: err.code,
        message: err.message,
        ...(err.details ? { details: err.details } : {}),
      },
    });
    return;
  }

  // Translate specific known Prisma (database) error codes into friendly API responses.
  if (err instanceof Prisma.PrismaClientKnownRequestError) {

    // P2002 = tried to insert a duplicate value where uniqueness is required.
    if (err.code === "P2002") {
      res.status(409).json({
        success: false,
        error: {
          code: "CONFLICT",
          message: "A resource with this value already exists",
        },
      });
      return;
    }

    // P2025 = tried to update/delete a record that doesn't exist.
    if (err.code === "P2025") {
      res.status(404).json({
        success: false,
        error: { code: "NOT_FOUND", message: "Resource not found" },
      });
      return;
    }

    // P2003 = violated a foreign key relationship (e.g. linked record still in use).
    if (err.code === "P2003") {
      res.status(409).json({
        success: false,
        error: {
          code: "CONFLICT",
          message: "This operation violates a data relationship constraint",
        },
      });
      return;
    }
  }

  // Anything else is unexpected, so log it for debugging and send a generic 500 response.
  logger.error({ err }, "Unhandled error");
  res.status(500).json({
    success: false,
    error: { code: "INTERNAL_ERROR", message: "An unexpected error occurred" },
  });
}
