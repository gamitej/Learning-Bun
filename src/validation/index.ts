import z from "zod";

export const loginSchema = z.object({
  username: z
    .string()
    .min(3, "Username must be at least 3 chars long")
    .max(30, "Username must be at most 30 chars long"),
  password: z
    .string()
    .min(6, "Password must be at least 6 chars long")
    .max(50, "Password must be at most 50 chars long"),
});
