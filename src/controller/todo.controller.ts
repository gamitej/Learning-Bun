import { db, todos } from "@/database";
import { Errors } from "@/utils/errors";
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
    if (!user)
      return sendError(
        c,
        Errors.UNAUTHORIZED.status,
        Errors.UNAUTHORIZED.message,
      );

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
    if (!user)
      return sendError(
        c,
        Errors.UNAUTHORIZED.status,
        Errors.UNAUTHORIZED.message,
      );

    const { task, title } = c.req.valid("json" as never);
    const todoTitle = title || task;

    const [todo] = await db
      .insert(todos)
      .values({ title: todoTitle, user_id: user.id })
      .returning();

    if (!todo)
      return sendError(
        c,
        Errors.TODO_CREATION_FAILED.status,
        Errors.TODO_CREATION_FAILED.message,
      );

    logger.info({ todoId: todo.id }, "New todo created");
    return sendResponse(c, 201, true, "Todo created", todo);
  }) as Handler,

  /**
   * =================== GET ONE TODO ===================
   */
  getOne: (async (c) => {
    const user = c.get("user");
    if (!user)
      return sendError(
        c,
        Errors.UNAUTHORIZED.status,
        Errors.UNAUTHORIZED.message,
      );

    const { id } = c.req.valid("param" as never);

    const [todo] = await db
      .select()
      .from(todos)
      .where(and(eq(todos.id, id), eq(todos.user_id, user.id)))
      .limit(1);

    if (!todo)
      return sendError(
        c,
        Errors.TODO_NOT_FOUND.status,
        Errors.TODO_NOT_FOUND.message,
      );

    return sendResponse(c, 200, true, "Todo fetched", todo);
  }) as Handler,

  /**
   * =================== UPDATE TODO ===================
   */
  update: (async (c) => {
    const user = c.get("user");
    if (!user)
      return sendError(
        c,
        Errors.UNAUTHORIZED.status,
        Errors.UNAUTHORIZED.message,
      );

    const { id } = c.req.valid("param" as never);
    const { title, completed } = c.req.valid("json" as never);

    const payload: { title?: string; completed?: boolean } = {};
    if (title !== undefined) payload.title = title;
    if (completed !== undefined) payload.completed = completed;

    const [todo] = await db
      .update(todos)
      .set(payload)
      .where(and(eq(todos.id, id), eq(todos.user_id, user.id)))
      .returning();

    if (!todo)
      return sendError(
        c,
        Errors.TODO_NOT_FOUND.status,
        Errors.TODO_NOT_FOUND.message,
      );

    return sendResponse(c, 200, true, "Todo updated", todo);
  }) as Handler,

  /**
   * =================== DELETE TODO ===================
   */
  delete: (async (c) => {
    const user = c.get("user");
    if (!user)
      return sendError(
        c,
        Errors.UNAUTHORIZED.status,
        Errors.UNAUTHORIZED.message,
      );

    const { id } = c.req.valid("param" as never);

    const [todo] = await db
      .delete(todos)
      .where(and(eq(todos.id, id), eq(todos.user_id, user.id)))
      .returning();

    if (!todo)
      return sendError(
        c,
        Errors.TODO_NOT_FOUND.status,
        Errors.TODO_NOT_FOUND.message,
      );

    logger.info({ todoId: id, userId: user.id }, "Todo deleted");
    return sendResponse(c, 200, true, "Todo deleted", todo);
  }) as Handler,
};
