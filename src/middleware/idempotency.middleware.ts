import { and, eq, gt } from "drizzle-orm";
import type { Context, Next } from "hono";
import { env } from "@/config/env";
import { db, idempotency } from "@/database";
import logger from "@/utils/logger";

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

    if (existing && existing.response) {
      logger.info({ key }, "🎯 Idempotency Hit: Returning cached response");
      return c.json(existing.response, 200);
    }

    if (existing && !existing.response) {
      return c.json(
        {
          success: false,
          message: "Request is already being processed. Please wait.",
        },
        409,
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
  } catch (err: any) {
    logger.error(
      { error: err.message, key },
      "❌ Idempotency Middleware Error",
    );
    return await next();
  }
};
