import { TodoController } from "@/controller/todo.controller";
import authMiddleware from "@/middleware/auth.middleware";
import { idempotencyMiddleware } from "@/middleware/idempotency.middleware";
import { validate } from "@/middleware/validation.middleware";
import {
  idParamSchema,
  todoCreateSchema,
  todoUpdateSchema,
} from "@/validation";
import { Hono } from "hono";

const todoRoutes = new Hono();

todoRoutes.use("*", authMiddleware);

todoRoutes.get("/", TodoController.getAll);
todoRoutes.post(
  "/",
  idempotencyMiddleware,
  validate("json", todoCreateSchema),
  TodoController.create,
);

todoRoutes.get("/:id", validate("param", idParamSchema), TodoController.getOne);
todoRoutes.put(
  "/:id",
  validate("param", idParamSchema),
  idempotencyMiddleware,
  validate("json", todoUpdateSchema),
  TodoController.update,
);
todoRoutes.delete(
  "/:id",
  validate("param", idParamSchema),
  idempotencyMiddleware,
  TodoController.delete,
);

export default todoRoutes;
