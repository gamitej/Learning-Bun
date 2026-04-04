import { env } from "@/config/env";
import { globalErrorHandler } from "@/utils/errors";
import { logger } from "@/utils/logger";
import { OpenAPIHono } from "@hono/zod-openapi";
import { cors } from "hono/cors";
import { logger as honoLogger } from "hono/logger";
import { startDatabase, stopDatabase } from "./database";
import routes from "./routes";

const app = new OpenAPIHono();

/**
 * Middleware
 */
app.use("*", cors());
app.use("*", honoLogger());

/**
 * Routes
 */
routes.registerRoutes(app);

/**
 * Global Error Handler
 */
app.onError(globalErrorHandler);

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
