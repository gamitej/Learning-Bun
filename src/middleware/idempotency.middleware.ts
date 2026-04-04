import { env } from "@/config/env";
import { db, idempotency } from "@/database";
import { Errors } from "@/utils/errors";
import { logger } from "@/utils/logger";
import { and, eq, gt } from "drizzle-orm";
import type { Context, Next } from "hono";

export const idempotencyMiddleware = async (c: Context, next: Next) => {
  if (["GET", "HEAD", "OPTIONS"].includes(c.req.method)) {
    return await next();
  }

  const key = c.req.header("x-idempotency-key");

  if (!key) {
    return await next();
  }

  try {
    const existing = await db.query.idempotency.findFirst({
      where: and(
        eq(idempotency.idempotencyKey, key),
        gt(idempotency.expiresAt, new Date()),
      ),
    });

    if (existing?.response) {
      logger.info({ key }, "🎯 Idempotency Hit: Returning cached response");
      return c.json(existing.response, 200);
    }

    if (existing && !existing.response) {
      return c.json(
        {
          success: false,
          message: Errors.REQUEST_IN_FLIGHT.message,
        },
        Errors.REQUEST_IN_FLIGHT.status,
      );
    }

    const expiresAt = new Date();
    expiresAt.setHours(
      expiresAt.getHours() + (env.IDEMPOTENCY_EXPIRES_HOURS || 24),
    );

    await db.insert(idempotency).values({
      idempotencyKey: key,
      expiresAt: expiresAt,
    });

    c.set("idempotencyKey", key);

    await next();
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    logger.error({ error: msg, key }, "❌ Idempotency Middleware Error");
    return await next();
  }
};
