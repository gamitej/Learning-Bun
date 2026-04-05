import { logger } from "@/utils/logger";
import type { Context, Next } from "hono";

/**
 * Structured HTTP request/response logging middleware.
 *
 * For every request this middleware:
 *  1. Generates a UUID correlation ID and attaches it to the response as `X-Request-Id`.
 *  2. Forks a pino child logger that carries `{ requestId, method, path }` on every
 *     log record emitted within that request — making distributed tracing trivial.
 *  3. Logs the incoming request at `info` level.
 *  4. After the handler chain resolves, logs the outgoing response with duration at
 *     a level that reflects the HTTP status: `info` (2xx/3xx), `warn` (4xx), `error` (5xx).
 *
 * Usage: app.use("*", requestLoggerMiddleware)
 * Access the child logger in any downstream handler: c.get("logger")
 */
export const requestLoggerMiddleware = async (
  c: Context,
  next: Next,
): Promise<void> => {
  const requestId = crypto.randomUUID();
  const startTime = Date.now();

  const reqLogger = logger.child({
    requestId,
    method: c.req.method,
    path: c.req.path,
  });

  c.set("logger", reqLogger);

  c.header("X-Request-Id", requestId);

  reqLogger.info(
    {
      ip:
        c.req.header("x-forwarded-for") ??
        c.req.header("x-real-ip") ??
        "unknown",
      userAgent: c.req.header("user-agent") ?? "unknown",
    },
    "request received",
  );

  await next();

  const status = c.res.status;
  const duration = Date.now() - startTime;
  const logLevel = status >= 500 ? "error" : status >= 400 ? "warn" : "info";

  reqLogger[logLevel]({ status, duration }, "request completed");
};
