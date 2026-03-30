import { TodoController } from "@/controller/todo.controller";
import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { z } from "zod";

const todoRoutes = new Hono();

const todoSchema = z.object({
  task: z.string().min(3, "Task must be at least 3 chars long"),
});

todoRoutes.get("/", TodoController.getAll);

todoRoutes.post("/", zValidator("json", todoSchema), TodoController.create);

export default todoRoutes;
