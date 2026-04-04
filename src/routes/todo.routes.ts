import { TodoController } from "@/controller/todo.controller";
import authMiddleware from "@/middleware/auth.middleware";
import { idempotencyMiddleware } from "@/middleware/idempotency.middleware";
import {
  errorResponseSchema,
  idParamSchema,
  todoResponseSchema,
  todosResponseSchema,
} from "@/validation";
import { OpenAPIHono, createRoute, z } from "@hono/zod-openapi";

const todoRoutes = new OpenAPIHono();

todoRoutes.use("*", authMiddleware);

const bearerAuth = [{ bearerAuth: [] }];

const getAllRoute = createRoute({
  method: "get",
  path: "/",
  tags: ["Todo"],
  summary: "List todos",
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

const createTodoRoute = createRoute({
  method: "post",
  path: "/",
  tags: ["Todo"],
  summary: "Create todo",
  security: bearerAuth,
  request: {
    body: {
      content: {
        "application/json": {
          schema: z
            .object({
              task: z.string().min(3).optional(),
              title: z.string().min(1).optional(),
            })
            .openapi("TodoCreate"),
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

const getOneRoute = createRoute({
  method: "get",
  path: "/{id}",
  tags: ["Todo"],
  summary: "Get todo",
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

const updateRoute = createRoute({
  method: "put",
  path: "/{id}",
  tags: ["Todo"],
  summary: "Update todo",
  security: bearerAuth,
  request: {
    params: idParamSchema,
    body: {
      content: {
        "application/json": {
          schema: z
            .object({
              title: z.string().min(1).optional(),
              completed: z.boolean().optional(),
            })
            .openapi("TodoUpdate"),
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

const deleteRoute = createRoute({
  method: "delete",
  path: "/{id}",
  tags: ["Todo"],
  summary: "Delete todo",
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

todoRoutes.openapi(getAllRoute, TodoController.getAll as any);
todoRoutes.openapi(
  createTodoRoute,
  idempotencyMiddleware as any,
  TodoController.create as any,
);
todoRoutes.openapi(getOneRoute, TodoController.getOne as any);
todoRoutes.openapi(
  updateRoute,
  idempotencyMiddleware as any,
  TodoController.update as any,
);
todoRoutes.openapi(
  deleteRoute,
  idempotencyMiddleware as any,
  TodoController.delete as any,
);

export default todoRoutes;
