import { env } from "@/config/env";
import pino from "pino";

const isProduction = env.NODE_ENV === "production";
const level = env.LOG_LEVEL ?? "info";

/**
 * Redact sensitive fields before they reach any log sink.
 * Covers top-level keys, one-level-deep nested keys, and common request header paths.
 */
const REDACTED_PATHS = [
  "password",
  "passwordRaw",
  "passwordHash",
  "secret",
  "token",
  "accessToken",
  "refreshToken",
  "*.password",
  "*.passwordRaw",
  "*.passwordHash",
  "*.secret",
  "*.token",
  "*.accessToken",
  "*.refreshToken",
  '*.headers["authorization"]',
  '*.headers["x-api-key"]',
  "*.headers.cookie",
];

const prettyTarget = {
  target: "pino-pretty",
  options: {
    colorize: true,
    translateTime: "SYS:yyyy-mm-dd HH:MM:ss",
    ignore: "pid,hostname",
    messageFormat: "{msg}",
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
  /**
   * Normalise error objects so `err.stack`, `err.type`, and `err.message`
   * are always present in log records, regardless of how errors are passed.
   */
  serializers: {
    err: pino.stdSerializers.err,
    error: pino.stdSerializers.err,
  },
  redact: {
    paths: REDACTED_PATHS,
    censor: "[REDACTED]",
  },
  base: {
    service: "backend-api",
    env: env.NODE_ENV,
  },
  transport: buildTransport(),
});

export default logger;
