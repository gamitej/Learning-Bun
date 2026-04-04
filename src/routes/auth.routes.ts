import { AuthController } from "@/controller/auth.controller";
import {
  authResponseSchema,
  errorResponseSchema,
  loginSchema,
  signupResponseSchema,
  signupSchema,
} from "@/validation";
import { OpenAPIHono, createRoute } from "@hono/zod-openapi";

const authRoutes = new OpenAPIHono();

const signupRoute = createRoute({
  method: "post",
  path: "/signup",
  tags: ["Auth"],
  summary: "Signup",
  request: {
    body: {
      content: { "application/json": { schema: signupSchema } },
      required: true,
    },
  },
  responses: {
    201: {
      description: "User created",
      content: { "application/json": { schema: signupResponseSchema } },
    },
    500: {
      description: "Creation failed",
      content: { "application/json": { schema: errorResponseSchema } },
    },
  },
});

const loginRoute = createRoute({
  method: "post",
  path: "/login",
  tags: ["Auth"],
  summary: "Login",
  request: {
    body: {
      content: { "application/json": { schema: loginSchema } },
      required: true,
    },
  },
  responses: {
    200: {
      description: "Login successful",
      content: { "application/json": { schema: authResponseSchema } },
    },
    401: {
      description: "Invalid credentials",
      content: { "application/json": { schema: errorResponseSchema } },
    },
  },
});

authRoutes.openapi(signupRoute, AuthController.signup);
authRoutes.openapi(loginRoute, AuthController.login);

export default authRoutes;
