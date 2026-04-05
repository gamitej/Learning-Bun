import { TodoController } from "@/controller/todo.controller";
import authMiddleware from "@/middleware/auth.middleware";
import { idempotencyMiddleware } from "@/middleware/idempotency.middleware";
import {
  errorResponseSchema,
  idParamSchema,
  todoCreateSchema,
  todoResponseSchema,
  todoUpdateSchema,
  todosResponseSchema,
} from "@/validation";
import { OpenAPIHono, createRoute } from "@hono/zod-openapi";

const todoRoutes = new OpenAPIHono();

const bearerAuth = [{ bearerAuth: [] }];

export const getAllRoute = createRoute({
  method: "get",
  path: "/",
  tags: ["Todo"],
  summary: "List todos",
  middleware: [authMiddleware] as const,
  security: bearerAuth,
  responses: {
    200: {
      description: "Todos fetched",
      content: { "application/json": { schema: todosResponseSchema } },
    },
    401: {
      description: "Unauthorized",
      content: { "application/json": { schema: errorResponseSchema } },
    },
  },
});

export const createTodoRoute = createRoute({
  method: "post",
  path: "/",
  tags: ["Todo"],
  summary: "Create todo",
  middleware: [authMiddleware, idempotencyMiddleware] as const,
  security: bearerAuth,
  request: {
    body: {
      content: {
        "application/json": {
          schema: todoCreateSchema,
        },
      },
      required: true,
    },
  },
  responses: {
    201: {
      description: "Todo created",
      content: { "application/json": { schema: todoResponseSchema } },
    },
    401: {
      description: "Unauthorized",
      content: { "application/json": { schema: errorResponseSchema } },
    },
  },
});

export const getOneRoute = createRoute({
  method: "get",
  path: "/{id}",
  tags: ["Todo"],
  summary: "Get todo",
  middleware: [authMiddleware] as const,
  security: bearerAuth,
  request: {
    params: idParamSchema,
  },
  responses: {
    200: {
      description: "Todo fetched",
      content: { "application/json": { schema: todoResponseSchema } },
    },
    404: {
      description: "Not found",
      content: { "application/json": { schema: errorResponseSchema } },
    },
  },
});

export const updateRoute = createRoute({
  method: "put",
  path: "/{id}",
  tags: ["Todo"],
  summary: "Update todo",
  middleware: [authMiddleware, idempotencyMiddleware] as const,
  security: bearerAuth,
  request: {
    params: idParamSchema,
    body: {
      content: {
        "application/json": {
          schema: todoUpdateSchema,
        },
      },
    },
  },
  responses: {
    200: {
      description: "Todo updated",
      content: { "application/json": { schema: todoResponseSchema } },
    },
    404: {
      description: "Not found",
      content: { "application/json": { schema: errorResponseSchema } },
    },
  },
});

export const deleteRoute = createRoute({
  method: "delete",
  path: "/{id}",
  tags: ["Todo"],
  summary: "Delete todo",
  middleware: [authMiddleware, idempotencyMiddleware] as const,
  security: bearerAuth,
  request: {
    params: idParamSchema,
  },
  responses: {
    200: {
      description: "Todo deleted",
      content: { "application/json": { schema: todoResponseSchema } },
    },
    404: {
      description: "Not found",
      content: { "application/json": { schema: errorResponseSchema } },
    },
  },
});

todoRoutes.openapi(getAllRoute, TodoController.getAll);
todoRoutes.openapi(createTodoRoute, TodoController.create);
todoRoutes.openapi(getOneRoute, TodoController.getOne);
todoRoutes.openapi(updateRoute, TodoController.update);
todoRoutes.openapi(deleteRoute, TodoController.delete);

export default todoRoutes;
