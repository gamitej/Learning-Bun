import { AuthController } from "@/controller/auth.controller";
import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { z } from "zod";

const authRoutes = new Hono();

const signupSchema = z.object({
  username: z.string().min(3),
  password: z.string().min(6),
});
const loginSchema = z.object({
  username: z.string().min(1),
  password: z.string().min(1),
});

authRoutes.post(
  "/signup",
  zValidator("json", signupSchema),
  AuthController.signup,
);
authRoutes.post(
  "/login",
  zValidator("json", loginSchema),
  AuthController.login,
);

export default authRoutes;
