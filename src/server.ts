import { Hono } from "hono";
import { logger } from "@/config/logger";
import todoRoutes from "./routes/todo.routes";
import { logger as honoLogger } from "hono/logger";

const app = new Hono();

app.use("*", honoLogger());

app.route("/api/todos", todoRoutes);

app.onError((err, res) => {
  logger.error({ err: err.message, stack: err.stack }, "Server Error");
  return res.json({ error: "Internal Server Error" }, 500);
});

export default {
  port: 3000,
  fetch: app.fetch,
};

logger.info("🚀 Bun server running at http://localhost:3000");