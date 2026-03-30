import type { Context } from "hono";
import type { ContentfulStatusCode } from "hono/utils/http-status";
import { clearRecord, storeResponse } from "./idempotency";

interface ResponseOptions {
  extraMessage?: string;
}

export const sendResponse = async (
  c: Context,
  statusCode: ContentfulStatusCode,
  success: boolean,
  message: string,
  data: any = null,
) => {
  const payload = { success, message, data };

  const key = c.get("idempotencyKey");

  if (key) {
    await storeResponse(key, payload);
  }

  return c.json(payload, statusCode);
};

/**
 * Error response helper for Hono
 * Automatically clears the idempotency record so the user can retry.
 */
export const sendError = async (
  c: Context,
  statusCode: ContentfulStatusCode,
  message: string,
  errors: any = null,
  options: ResponseOptions = {},
) => {
  const key = c.get("idempotencyKey");

  if (key) {
    await clearRecord(key);
  }

  const payload = {
    success: false,
    message,
    ...(errors && { errors }),
    ...(options.extraMessage && { extraMessage: options.extraMessage }),
  };

  return c.json(payload, statusCode);
};
