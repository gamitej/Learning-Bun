import { db, idempotency } from "@/database";
import { logger } from "@/utils/logger";
import { eq } from "drizzle-orm";

export async function storeResponse(
  idempotencyKey: string,
  responsePayload: unknown,
): Promise<void> {
  if (!idempotencyKey) return;

  try {
    const result = await db
      .update(idempotency)
      .set({
        response: responsePayload,
      })
      .where(eq(idempotency.idempotencyKey, idempotencyKey));

    if (result.count === 0) {
      logger.warn(
        { idempotencyKey },
        "Attempted to store response for non-existent key",
      );
    }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    logger.error(
      { error: msg, idempotencyKey },
      "Failed to update idempotency record",
    );
  }
}

/**
 * Remove an idempotency record.
 * Essential if the controller crashes before finishing so the user can retry.
 */
export async function clearRecord(idempotencyKey: string): Promise<void> {
  if (!idempotencyKey) return;

  try {
    await db
      .delete(idempotency)
      .where(eq(idempotency.idempotencyKey, idempotencyKey));
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    logger.error(
      { error: msg, idempotencyKey },
      "Failed to cleanup idempotency record",
    );
  }
}
