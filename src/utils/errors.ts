import { sendError } from "@/utils/helper";
import { logger } from "@/utils/logger";
import type { Context } from "hono";
import type { ContentfulStatusCode } from "hono/utils/http-status";

interface AppError {
  message: string;
  status: ContentfulStatusCode;
}

export const Errors = {
  /**
   *  Auth
   */
  UNAUTHORIZED: { status: 401, message: "Unauthorized" },
  NO_TOKEN: { status: 401, message: "Unauthorized: No token provided" },
  MALFORMED_TOKEN: { status: 401, message: "Unauthorized: Malformed token" },
  INVALID_TOKEN: {
    status: 401,
    message: "Unauthorized: Invalid or expired token",
  },
  INVALID_CREDENTIALS: { status: 401, message: "Invalid credentials" },
  USER_CREATION_FAILED: { status: 500, message: "Failed to create user" },

  /**
   *  Validation
   */
  VALIDATION_FAILED: { status: 400, message: "Validation failed" },
  INVALID_ID: { status: 400, message: "Invalid ID format" },
  NO_FIELDS_TO_UPDATE: { status: 400, message: "No valid fields to update" },

  /**
   *  Todo
   */
  TODO_NOT_FOUND: { status: 404, message: "Todo not found" },
  TODO_CREATION_FAILED: { status: 500, message: "Failed to create todo" },

  /**
   *  Database
   */
  DUPLICATE_RECORD: { status: 409, message: "Record already exists" },
  DB_VALIDATION_FAILED: {
    status: 400,
    message: "Validation check failed: Invalid data range",
  },

  /**
   *  Idempotency
   */
  REQUEST_IN_FLIGHT: {
    status: 409,
    message: "Request is already being processed. Please wait.",
  },

  /**
   *  Generic
   */
  INTERNAL: {
    status: 500,
    message: "An unexpected error occurred. Please try again.",
  },
} as const satisfies Record<string, AppError>;

export type ErrorKey = keyof typeof Errors;

export const globalErrorHandler = (err: Error, c: Context) => {
  logger.error(
    { err: err.message, stack: err.stack, path: c.req.path },
    "Global Error Caught",
  );

  const code = (err as unknown as { code?: string }).code;

  if (code === "23505") {
    return sendError(
      c,
      Errors.DUPLICATE_RECORD.status,
      Errors.DUPLICATE_RECORD.message,
    );
  }
  if (code === "23514") {
    return sendError(
      c,
      Errors.DB_VALIDATION_FAILED.status,
      Errors.DB_VALIDATION_FAILED.message,
    );
  }

  return sendError(c, Errors.INTERNAL.status, Errors.INTERNAL.message);
};
