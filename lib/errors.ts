// The fixed set of short labels we use to describe what kind of error happened.
export type ErrorCode =
  | "VALIDATION_ERROR"
  | "UNAUTHENTICATED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "CONFLICT"
  | "PAYLOAD_TOO_LARGE"
  | "UNSUPPORTED_MEDIA_TYPE"
  | "RATE_LIMITED"
  | "INTERNAL_ERROR";

// Describes one specific problem, which field failed and why.
export interface ErrorDetail {
  path: string; // Path to the field that failed validation
  message: string; // Error message
}

// A custom error type that carries extra info (HTTP status, error code) on top of a normal javascript Error, so our error handler knows how to respond.

export class AppError extends Error {
  readonly statusCode: number;
  readonly code: ErrorCode;
  readonly details?: ErrorDetail[];

  constructor(message: string, statusCode: number, code: ErrorCode, details?: ErrorDetail[]) {
    super(message); // super is used to call the constructor of the parent class (Error).

    // Use the actual subclass name (e.g. "NotFoundError") instead of just "Error".

    this.name = new.target.name; // new.target is a special keyword that tells you which constructor was called using the new keyword.

    this.statusCode = statusCode;
    this.code = code;
    this.details = details;

    // Keeps the stack trace clean, pointing to where the error was thrown.
    Error.captureStackTrace?.(this, new.target);
  }
}

// Thrown when incoming request data (body, params, query) fails validation. Maps to HTTP 400.
export class ValidationError extends AppError {
  constructor(message = "Request validation failed", details?: ErrorDetail[]) {
    super(message, 400, "VALIDATION_ERROR", details);
  }
}

// Thrown when the user isn't logged in but the route requires login. Maps to HTTP 401.
export class UnauthenticatedError extends AppError {
  constructor(message = "Authentication required") {
    super(message, 401, "UNAUTHENTICATED");
  }
}

// Thrown when the user is logged in but isn't allowed to do this action. Maps to HTTP 403.
export class ForbiddenError extends AppError {
  constructor(message = "You do not have permission to perform this action") {
    super(message, 403, "FORBIDDEN");
  }
}

// Thrown when the requested resource (e.g. a workspace or project) doesn't exist. Maps to HTTP 404.
export class NotFoundError extends AppError {
  constructor(message = "Resource not found") {
    super(message, 404, "NOT_FOUND");
  }
}

// Thrown when the request conflicts with existing data, e.g. a duplicate name. Maps to HTTP 409.
export class ConflictError extends AppError {
  constructor(message = "A conflicting resource already exists") {
    super(message, 409, "CONFLICT");
  }
}

// Thrown when an uploaded file exceeds the allowed size limit. Maps to HTTP 413.
export class PayloadTooLargeError extends AppError {
  constructor(message = "The uploaded file is too large") {
    super(message, 413, "PAYLOAD_TOO_LARGE");
  }
}

// Thrown when an uploaded file's type isn't on the allowlist. Maps to HTTP 415.
export class UnsupportedMediaTypeError extends AppError {
  constructor(message = "Unsupported file type") {
    super(message, 415, "UNSUPPORTED_MEDIA_TYPE");
  }
}

// Thrown when a client exceeds a rate limit (see lib/rate-limit.ts). Maps to HTTP 429.
export class RateLimitedError extends AppError {
  constructor(message = "Too many requests. Please try again shortly.") {
    super(message, 429, "RATE_LIMITED");
  }
}
