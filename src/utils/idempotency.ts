import { eq } from "drizzle-orm";
import { db, idempotency } from "@/database";
import logger from "@/utils/logger";

export async function storeResponse(
  idempotencyKey: string,
  responsePayload: any,
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
  } catch (err: any) {
    logger.error(
      { error: err.message, idempotencyKey },
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
  } catch (err: any) {
    logger.error(
      { error: err.message, idempotencyKey },
      "Failed to cleanup idempotency record",
    );
  }
}
