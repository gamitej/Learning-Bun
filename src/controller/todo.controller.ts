import { db, todos } from "@/database";
import { sendError, sendResponse } from "@/utils/helper";
import { logger } from "@/utils/logger";
import { and, eq } from "drizzle-orm";
import type { Handler } from "hono";

export const TodoController = {
  /**
   * =================== GET ALL TODOS ===================
   */
  getAll: (async (c) => {
    const user = c.get("user");
    if (!user) return sendError(c, 401, "Unauthorized");

    const items = await db
      .select()
      .from(todos)
      .where(eq(todos.user_id, user.id));

    return sendResponse(c, 200, true, "Todos fetched", items);
  }) as Handler,

  /**
   * =================== CREATE TODO ===================
   */
  create: (async (c) => {
    const user = c.get("user");
    if (!user) return sendError(c, 401, "Unauthorized");

    const { task, title } = await c.req.json();
    const todoTitle = title || task || "Untitled task";

    const [todo] = await db
      .insert(todos)
      .values({ title: todoTitle, user_id: user.id })
      .returning();

    if (!todo) return sendError(c, 500, "Failed to create todo");

    logger.info({ todoId: todo.id }, "New todo created");
    return sendResponse(c, 201, true, "Todo created", todo);
  }) as Handler,

  /**
   * =================== GET ONE TODO ===================
   */
  getOne: (async (c) => {
    const user = c.get("user");
    if (!user) return sendError(c, 401, "Unauthorized");

    const id = Number(c.req.param("id"));
    if (Number.isNaN(id)) return sendError(c, 400, "Invalid ID format");

    const [todo] = await db
      .select()
      .from(todos)
      .where(and(eq(todos.id, id), eq(todos.user_id, user.id)))
      .limit(1);

    if (!todo) return sendError(c, 404, "Todo not found");

    return sendResponse(c, 200, true, "Todo fetched", todo);
  }) as Handler,

  /**
   * =================== UPDATE TODO ===================
   */
  update: (async (c) => {
    const user = c.get("user");
    if (!user) return sendError(c, 401, "Unauthorized");

    const id = Number(c.req.param("id"));
    const payload = await c.req.json();

    const [todo] = await db
      .update(todos)
      .set(payload)
      .where(and(eq(todos.id, id), eq(todos.user_id, user.id)))
      .returning();

    if (!todo) return sendError(c, 404, "Todo not found");

    return sendResponse(c, 200, true, "Todo updated", todo);
  }) as Handler,

  /**
   * =================== DELETE TODO ===================
   */
  delete: (async (c) => {
    const user = c.get("user");
    if (!user) return sendError(c, 401, "Unauthorized");

    const id = Number(c.req.param("id"));

    const [todo] = await db
      .delete(todos)
      .where(and(eq(todos.id, id), eq(todos.user_id, user.id)))
      .returning();

    if (!todo) return sendError(c, 404, "Todo not found");

    logger.info({ todoId: id, userId: user.id }, "Todo deleted");
    return sendResponse(c, 200, true, "Todo deleted", todo);
  }) as Handler,
};
