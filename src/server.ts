import { sendError } from "@/utils/helper";
import { logger } from "@/utils/logger";
import { Hono } from "hono";
import { logger as honoLogger } from "hono/logger";
import routes from "./routes";

const app = new Hono();

app.use("*", honoLogger());

routes.registerRoutes(app);

app.onError((err, c) => {
  logger.error(
    {
      err: err.message,
      stack: err.stack,
      path: c.req.path,
    },
    "Global Error Caught",
  );

  const errorCode = (err as any).code;

  if (errorCode === "23505") {
    return sendError(c, 409, "Record already exists.");
  }

  if (errorCode === "23514") {
    return sendError(c, 400, "Validation check failed: Invalid data range.");
  }

  const errorMessage = "An unexpected error occurred. Please try again.";

  return sendError(c, 500, errorMessage);
});

export default {
  port: 3000,
  fetch: app.fetch,
};

logger.info("🚀 Bun server running at http://localhost:3000");
