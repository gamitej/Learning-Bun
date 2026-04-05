import { db, todos } from "@/database";
import type {
  createTodoRoute,
  deleteRoute,
  getAllRoute,
  getOneRoute,
  updateRoute,
} from "@/routes/todo.routes";
import { Errors } from "@/utils/errors";
import { sendError, sendResponse } from "@/utils/helper";
import { logger } from "@/utils/logger";
import type { RouteHandler } from "@hono/zod-openapi";
import { and, eq } from "drizzle-orm";

export const TodoController = {
  /**
   * ================== GET ALL TODOS ==================
   */
  getAll: (async (c) => {
    const user = c.get("user");
    if (!user) {
      logger.warn("Unauthorized access attempt to get all todos");
      return sendError(
        c,
        Errors.UNAUTHORIZED.status,
        Errors.UNAUTHORIZED.message,
      );
    }

    const items = await db
      .select()
      .from(todos)
      .where(eq(todos.user_id, user.id));

    logger.info({ userId: user.id, count: items.length }, "Fetched todos");
    return sendResponse(c, 200, true, "Todos fetched", items);
  }) as RouteHandler<typeof getAllRoute>,

  /**
   * =================== CREATE TODO ===================
   */
  create: (async (c) => {
    const user = c.get("user");
    if (!user) {
      logger.warn("Unauthorized access attempt to create todo");
      return sendError(
        c,
        Errors.UNAUTHORIZED.status,
        Errors.UNAUTHORIZED.message,
      );
    }

    const { task, title } = c.req.valid("json");
    const todoTitle = title || task;

    const [todo] = await db
      .insert(todos)
      .values({ title: todoTitle, user_id: user.id })
      .returning();

    if (!todo) {
      logger.error(
        { userId: user.id, payload: { title, task } },
        "Failed to create todo",
      );
      return sendError(
        c,
        Errors.TODO_CREATION_FAILED.status,
        Errors.TODO_CREATION_FAILED.message,
      );
    }

    logger.info(
      { todoId: todo.id, userId: user.id, savedTitle: todo.title },
      "New todo created",
    );
    return sendResponse(c, 201, true, "Todo created", todo);
  }) as RouteHandler<typeof createTodoRoute>,

  /**
   * =================== GET ONE TODO ===================
   */
  getOne: (async (c) => {
    const user = c.get("user");
    if (!user) {
      logger.warn("Unauthorized access attempt to get a todo");
      return sendError(
        c,
        Errors.UNAUTHORIZED.status,
        Errors.UNAUTHORIZED.message,
      );
    }

    const { id } = c.req.valid("param");

    const [todo] = await db
      .select()
      .from(todos)
      .where(and(eq(todos.id, id), eq(todos.user_id, user.id)))
      .limit(1);

    if (!todo) {
      logger.warn({ userId: user.id, todoId: id }, "Todo not found");
      return sendError(
        c,
        Errors.TODO_NOT_FOUND.status,
        Errors.TODO_NOT_FOUND.message,
      );
    }

    logger.info({ userId: user.id, todoId: id }, "Fetched todo");
    return sendResponse(c, 200, true, "Todo fetched", todo);
  }) as RouteHandler<typeof getOneRoute>,

  /**
   * =================== UPDATE TODO ===================
   */
  update: (async (c) => {
    const user = c.get("user");
    if (!user) {
      logger.warn("Unauthorized access attempt to update a todo");
      return sendError(
        c,
        Errors.UNAUTHORIZED.status,
        Errors.UNAUTHORIZED.message,
      );
    }

    const { id } = c.req.valid("param");
    const { title, completed } = c.req.valid("json");

    const payload: Partial<typeof todos.$inferInsert> = { title, completed };
    if (title !== undefined) payload.title = title;
    if (completed !== undefined) payload.completed = completed;

    const [todo] = await db
      .update(todos)
      .set(payload)
      .where(and(eq(todos.id, id), eq(todos.user_id, user.id)))
      .returning();

    if (!todo) {
      logger.warn(
        { userId: user.id, todoId: id },
        "Update failed: Todo not found",
      );
      return sendError(
        c,
        Errors.TODO_NOT_FOUND.status,
        Errors.TODO_NOT_FOUND.message,
      );
    }

    logger.info(
      { userId: user.id, todoId: id, changes: Object.keys(payload) },
      "Todo updated successfully",
    );
    return sendResponse(c, 200, true, "Todo updated", todo);
  }) as RouteHandler<typeof updateRoute>,

  /**
   * =================== DELETE TODO ===================
   */
  delete: (async (c) => {
    const user = c.get("user");
    if (!user) {
      logger.warn("Unauthorized access attempt to delete a todo");
      return sendError(
        c,
        Errors.UNAUTHORIZED.status,
        Errors.UNAUTHORIZED.message,
      );
    }

    const { id } = c.req.valid("param");

    const [todo] = await db
      .delete(todos)
      .where(and(eq(todos.id, id), eq(todos.user_id, user.id)))
      .returning();

    if (!todo) {
      logger.warn(
        { userId: user.id, todoId: id },
        "Todo not found for deletion",
      );
      return sendError(
        c,
        Errors.TODO_NOT_FOUND.status,
        Errors.TODO_NOT_FOUND.message,
      );
    }

    logger.info({ todoId: id, userId: user.id }, "Todo deleted");
    return sendResponse(c, 200, true, "Todo deleted", todo);
  }) as RouteHandler<typeof deleteRoute>,
};
