import { logger } from "@/utils/logger";
import { Hono } from "hono";
import { logger as honoLogger } from "hono/logger";
import authRoutes from "./routes/auth.routes";
import docsRoutes from "./routes/docs.routes";
import todoRoutes from "./routes/todo.routes";

const app = new Hono();

app.use("*", honoLogger());

app.route("/api/todos", todoRoutes);
app.route("/api/auth", authRoutes);
app.route("/api/docs", docsRoutes);

app.onError((err, res) => {
  logger.error({ err: err.message, stack: err.stack }, "Server Error");
  return res.json({ error: "Internal Server Error" }, 500);
});

export default {
  port: 3000,
  fetch: app.fetch,
};

logger.info("🚀 Bun server running at http://localhost:3000");
