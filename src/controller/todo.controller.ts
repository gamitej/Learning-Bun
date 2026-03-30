import type { Context } from "hono";
import { logger } from "@/utils/logger";

export const TodoController = {
  getAll: (c: Context) => {
    logger.info("Fetching all todos");
    return c.json({ success: true, data: [] });
  },

  create: async (c: Context) => {
    logger.info({ todoId: "" }, "New todo created");
    return c.json({ success: true, data: [] }, 201);
  },
};
