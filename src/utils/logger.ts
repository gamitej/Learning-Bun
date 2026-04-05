import { env } from "@/config/env";
import pino from "pino";

const isProduction = env.NODE_ENV === "production";
const level = env.LOG_LEVEL ?? "info";

const prettyTarget = {
  target: "pino-pretty",
  options: {
    colorize: true,
    translateTime: "SYS:yyyy-mm-dd HH:MM:ss",
    ignore: "pid,hostname",
  },
  level,
};

const stdoutTarget = {
  target: "pino/file",
  options: { destination: 1 },
  level,
};

const lokiTarget = env.LOKI_URL
  ? {
      target: "pino-loki",
      options: {
        host: env.LOKI_URL,
        labels: { application: "backend-api", env: env.NODE_ENV },
        replaceTimestamp: true,
        silenceErrors: false,
        batching: true,
        interval: 5,
      },
      level,
    }
  : null;

function buildTransport():
  | pino.TransportSingleOptions
  | pino.TransportMultiOptions
  | undefined {
  const targets = isProduction
    ? [stdoutTarget, ...(lokiTarget ? [lokiTarget] : [])]
    : [prettyTarget, ...(lokiTarget ? [lokiTarget] : [])];

  if (targets.length === 1) {
    const { target, options } = targets[0] as pino.TransportSingleOptions & {
      level: string;
    };
    return { target, options };
  }

  return { targets } as pino.TransportMultiOptions;
}

export const logger = pino({
  level,
  transport: buildTransport(),
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
