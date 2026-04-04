import { TodoController } from "@/controller/todo.controller";
import authMiddleware from "@/middleware/auth.middleware";
import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { z } from "zod";

const todoRoutes = new Hono();

const todoSchema = z.object({
  task: z.string().min(3, "Task must be at least 3 chars long").optional(),
  title: z.string().min(1).optional(),
  completed: z.boolean().optional(),
});

todoRoutes.use("*", authMiddleware);

todoRoutes.get("/", TodoController.getAll);
todoRoutes.post("/", zValidator("json", todoSchema), TodoController.create);

todoRoutes.get("/:id", TodoController.getOne);
todoRoutes.put("/:id", zValidator("json", todoSchema), TodoController.update);
todoRoutes.delete("/:id", TodoController.delete);

export default todoRoutes;
