import { z } from "@hono/zod-openapi";

/**
 * ================== AUTH SCHEMAS ===================
 */

export const signupSchema = z
  .object({
    username: z
      .string()
      .min(3, "Username must be at least 3 chars long")
      .max(30, "Username must be at most 30 chars long"),
    password: z
      .string()
      .min(6, "Password must be at least 6 chars long")
      .max(50, "Password must be at most 50 chars long"),
  })
  .openapi("UserSignup");

export const loginSchema = z
  .object({
    username: z.string().min(1, "Username is required"),
    password: z.string().min(1, "Password is required"),
  })
  .openapi("UserLogin");

export const authResponseSchema = z
  .object({
    success: z.boolean(),
    message: z.string(),
    data: z.object({
      token: z.string(),
    }),
  })
  .openapi("AuthResponse");

export const signupResponseSchema = z
  .object({
    success: z.boolean(),
    message: z.string(),
    data: z.object({
      id: z.number(),
      username: z.string(),
    }),
  })
  .openapi("SignupResponse");

/**
 * ================== TODO SCHEMAS ===================
 */

export const todoCreateSchema = z
  .object({
    task: z.string().min(3, "Task must be at least 3 chars long"),
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

export const idParamSchema = z
  .object({
    id: z.coerce.number().int().positive("ID must be a positive integer"),
  })
  .openapi("IdParam");

export const todoSchema = z
  .object({
    id: z.number(),
    title: z.string(),
    completed: z.boolean(),
    user_id: z.number(),
  })
  .openapi("Todo");

export const todoResponseSchema = z
  .object({
    success: z.boolean(),
    message: z.string(),
    data: todoSchema,
  })
  .openapi("TodoResponse");

export const todosResponseSchema = z
  .object({
    success: z.boolean(),
    message: z.string(),
    data: z.array(todoSchema),
  })
  .openapi("TodosResponse");

export const errorResponseSchema = z
  .object({
    success: z.boolean(),
    message: z.string(),
  })
  .openapi("ErrorResponse");
