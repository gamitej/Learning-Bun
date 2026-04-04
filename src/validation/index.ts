import z from "zod";

export const signupSchema = z.object({
  username: z
    .string()
    .min(3, "Username must be at least 3 chars long")
    .max(30, "Username must be at most 30 chars long"),
  password: z
    .string()
    .min(6, "Password must be at least 6 chars long")
    .max(50, "Password must be at most 50 chars long"),
});

export const loginSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});

export const todoCreateSchema = z
  .object({
    task: z.string().min(3, "Task must be at least 3 chars long").optional(),
    title: z.string().min(1, "Title is required").optional(),
  })
  .refine((data) => data.task || data.title, {
    message: "Either 'task' or 'title' must be provided",
  });

export const todoUpdateSchema = z
  .object({
    title: z.string().min(1, "Title cannot be empty").optional(),
    completed: z.boolean().optional(),
  })
  .refine((data) => data.title !== undefined || data.completed !== undefined, {
    message: "At least one field (title or completed) must be provided",
  });

export const idParamSchema = z.object({
  id: z.coerce.number().int().positive("ID must be a positive integer"),
});
