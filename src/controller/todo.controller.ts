import { db, todos } from "@/database";
import { sendError, sendResponse } from "@/utils/helper";
import { logger } from "@/utils/logger";
import { and, eq } from "drizzle-orm";
import type { Context } from "hono";

export const TodoController = {
  /**
   * =================== GET ALL TODOS ===================
   */
  getAll: async (c: Context) => {
    try {
      const user = c.get("user");
      if (!user) return sendError(c, 401, "Unauthorized");
      const items = await db
        .select()
        .from(todos)
        .where(eq(todos.user_id, user.id));
      return sendResponse(c, 200, true, "Todos fetched", items);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      logger.error({ err: msg }, "Failed to fetch todos");
      return sendError(c, 500, "Failed to fetch todos", msg);
    }
  },

  /**
   * =================== CREATE TODO ===================
   */
  create: async (c: Context) => {
    try {
      const user = c.get("user");
      if (!user) return sendError(c, 401, "Unauthorized");

      const { task, title } = await c.req.json();
      const todoTitle = title || task || "Untitled task";

      const inserted = await db
        .insert(todos)
        .values({ title: todoTitle, user_id: user.id })
        .returning();
      const todo = inserted[0];
      if (!todo) {
        logger.error("Failed to create todo: No record returned");
        return sendError(c, 500, "Failed to create todo");
      }

      logger.info({ todoId: todo.id }, "New todo created");
      return sendResponse(c, 201, true, "Todo created", todo);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      logger.error({ err: msg }, "Failed to create todo");
      return sendError(c, 500, "Failed to create todo", msg);
    }
  },

  /**
   * =================== GET ONE TODO ===================
   */
  getOne: async (c: Context) => {
    try {
      const user = c.get("user");
      if (!user) {
        logger.warn("Unauthorized access attempt to getOne todo");
        return sendError(c, 401, "Unauthorized");
      }

      const id = Number(c.req.param("id"));

      if (Number.isNaN(id)) {
        logger.warn(
          { id: c.req.param("id"), userId: user.id },
          "Invalid ID format",
        );
        return sendError(c, 400, "Invalid ID format");
      }

      const [todo] = await db
        .select()
        .from(todos)
        .where(and(eq(todos.id, id), eq(todos.user_id, user.id)))
        .limit(1);

      if (!todo) {
        logger.warn({ todoId: id, userId: user.id }, "Todo not found");
        return sendError(c, 404, "Todo not found");
      }

      logger.info({ todoId: id, userId: user.id }, "Todo fetched");
      return sendResponse(c, 200, true, "Todo fetched", todo);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      logger.error({ err: msg }, "Failed to fetch todo");
      return sendError(c, 500, "Internal Server Error", msg);
    }
  },

  /**
   * =================== UPDATE TODO ===================
   */
  update: async (c: Context) => {
    try {
      const user = c.get("user");
      if (!user) {
        logger.warn("Unauthorized access attempt to update todo");
        return sendError(c, 401, "Unauthorized");
      }
      const id = Number(c.req.param("id"));
      const payload = await c.req.json();
      const updated = await db
        .update(todos)
        .set(payload)
        .where(and(eq(todos.id, id), eq(todos.user_id, user.id)))
        .returning();
      const todo = updated[0];
      if (!todo) return sendError(c, 404, "Not found");
      return sendResponse(c, 200, true, "Todo updated", todo);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      return sendError(c, 500, "Failed to update todo", msg);
    }
  },

  /**
   * =================== DELETE TODO ===================
   */
  delete: async (c: Context) => {
    try {
      const user = c.get("user");
      if (!user) {
        logger.warn("Unauthorized access attempt to delete todo");
        return sendError(c, 401, "Unauthorized");
      }

      const id = Number(c.req.param("id"));
      const deleted = await db
        .delete(todos)
        .where(and(eq(todos.id, id), eq(todos.user_id, user.id)))
        .returning();
      const todo = deleted[0];
      if (!todo) {
        logger.warn(
          { todoId: id, userId: user.id },
          "Todo not found for deletion",
        );
        return sendError(c, 404, "Not found");
      }

      logger.info({ todoId: id, userId: user.id }, "Todo deleted");
      return sendResponse(c, 200, true, "Todo deleted", todo);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      return sendError(c, 500, "Failed to delete todo", msg);
    }
  },
};
