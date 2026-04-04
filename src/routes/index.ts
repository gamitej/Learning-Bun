import { getDb } from "@/database";
import { logger } from "@/utils/logger";
import type { OpenAPIHono } from "@hono/zod-openapi";
import { sql } from "drizzle-orm";
import authRoutes from "./auth.routes";
import docsRoutes from "./docs.routes";
import todoRoutes from "./todo.routes";

export function registerRoutes(app: OpenAPIHono) {
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

  // Register security scheme for bearer auth
  app.openAPIRegistry.registerComponent("securitySchemes", "bearerAuth", {
    type: "http",
    scheme: "bearer",
    bearerFormat: "JWT",
  });

  // Auto-generated OpenAPI spec from Zod schemas
  app.doc("/api/docs/openapi.json", {
    openapi: "3.0.1",
    info: {
      title: "Todo API",
      version: "1.0.0",
      description: "API for user-authenticated todo management",
    },
    servers: [{ url: "/api" }],
    tags: [
      { name: "Auth", description: "Authentication endpoints" },
      { name: "Todo", description: "Todo management endpoints" },
    ],
  });
}

export default {
  registerRoutes,
};
