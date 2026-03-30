import pino from "pino";
import { env } from "@/config/env";

const isProduction = env.NODE_ENV === "production";

export const logger = pino({
  level: env.LOG_LEVEL || "info",
  transport: !isProduction
    ? {
        target: "pino-pretty",
        options: {
          colorize: true,
          translateTime: "SYS:yyyy-mm-dd HH:MM:ss",
          ignore: "pid,hostname",
        },
      }
    : undefined,
  base: {
    service: "backend-api",
  },
});

export const logRequest = (c: any, meta = {}) => {
  logger.info(
    {
      method: c.req.method,
      url: c.req.url,
      ip: c.req.header("x-forwarded-for") || "127.0.0.1",
      userAgent: c.req.header("user-agent"),
      ...meta,
    },
    "HTTP Request",
  );
};

export const logResponse = (c: any, duration: number, meta = {}) => {
  const statusCode = c.res.status;
  const level = statusCode >= 400 ? "warn" : "info";

  logger[level](
    {
      method: c.req.method,
      url: c.req.url,
      statusCode,
      duration: `${duration}ms`,
      ...meta,
    },
    "HTTP Response",
  );
};

export default logger;
