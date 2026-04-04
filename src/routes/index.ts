import type { Hono } from "hono";
import authRoutes from "./auth.routes";
import docsRoutes from "./docs.routes";
import todoRoutes from "./todo.routes";

export function registerRoutes(app: Hono) {
  app.route("/api/todos", todoRoutes);
  app.route("/api/auth", authRoutes);
  app.route("/api/docs", docsRoutes);
}

export default {
  registerRoutes,
};
