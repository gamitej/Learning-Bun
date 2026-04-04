import { AuthController } from "@/controller/auth.controller";
import { validate } from "@/middleware/validation.middleware";
import { loginSchema, signupSchema } from "@/validation";
import { Hono } from "hono";

const authRoutes = new Hono();

authRoutes.post(
  "/signup",
  validate("json", signupSchema),
  AuthController.signup,
);
authRoutes.post("/login", validate("json", loginSchema), AuthController.login);

export default authRoutes;
