import { env } from "@/config/env";
import { logger } from "@/utils/logger";
import { createApp } from "./app";
import { startDatabase, stopDatabase } from "./database";

const app = createApp();

/**
 * Graceful Shutdown
 */
const shutdown = async () => {
  logger.info("Shutting down server");
  try {
    await stopDatabase();
  } catch (e) {
    logger.error({ err: e }, "Error during shutdown");
  }
  process.exit(0);
};

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);

/**
 * Start Server
 */
(async () => {
  try {
    await startDatabase();
    logger.info(`Server running at http://localhost:${env.PORT}`);
  } catch (err) {
    logger.error({ err }, "Failed to start database");
    process.exit(1);
  }
})();

export default {
  port: env.PORT,
  fetch: app.fetch,
};
