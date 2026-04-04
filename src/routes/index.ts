import { getDb } from "@/database";
import { logger } from "@/utils/logger";
import { sql } from "drizzle-orm";
import type { Hono } from "hono";
import authRoutes from "./auth.routes";
import docsRoutes from "./docs.routes";
import todoRoutes from "./todo.routes";

export function registerRoutes(app: Hono) {
  app.get("/health", async (c) => {
    try {
      const db = getDb();
      await db.execute(sql`SELECT 1`);
      return c.json({ status: "ok", db: "connected" });
    } catch {
      logger.error("Health check: database unreachable");
      return c.json({ status: "degraded", db: "disconnected" }, 503);
    }
  });

  app.route("/api/todos", todoRoutes);
  app.route("/api/auth", authRoutes);
  app.route("/api/docs", docsRoutes);
}

export default {
  registerRoutes,
};
