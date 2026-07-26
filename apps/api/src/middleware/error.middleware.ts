import { NextFunction, Request, Response } from "express";
import multer from "multer";
import { Prisma } from "@repo/database";
import logger from "../config/logger";
import { AppError } from "../lib/errors";

// Express's central error handler — every "next(err)" call in the app ends up here, and this function decides what status and JSON to send back.

export function errorMiddleware(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  // If the error is one of our custom errors, use the status code and message it already provides.
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

  // Multer returns its own file size error format; convert it to our standard 413 API error response.
  if (err instanceof multer.MulterError && err.code === "LIMIT_FILE_SIZE") {
    res.status(413).json({
      success: false,
      error: {
        code: "PAYLOAD_TOO_LARGE",
        message: "The uploaded file is too large",
      },
    });
    return;
  }

  // Translate known database errors from Prisma into user-friendly API responses.
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    // P2002: tried to insert a duplicate value where uniqueness is required.
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

    // P2025: tried to update/delete a record that doesn't exist.
    if (err.code === "P2025") {
      res.status(404).json({
        success: false,
        error: { code: "NOT_FOUND", message: "Resource not found" },
      });
      return;
    }

    // P2003: violated a foreign key relationship (e.g. linked record still in use).
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
