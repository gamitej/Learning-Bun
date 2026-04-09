import { requestLoggerMiddleware } from "@/middleware/request-logger.middleware";
import { Errors, globalErrorHandler } from "@/utils/errors";
import { OpenAPIHono } from "@hono/zod-openapi";
import { cors } from "hono/cors";
import routes from "./routes";

export function createApp() {
  const app = new OpenAPIHono({
    defaultHook: (result, c) => {
      if (!result.success) {
        return c.json(
          {
            success: false,
            message: Errors.VALIDATION_FAILED.message,
            errors: result.error.issues.map((issue) => ({
              path: issue.path.join("."),
              message: issue.message,
            })),
          },
          Errors.VALIDATION_FAILED.status as Parameters<typeof c.json>[1],
        );
      }
    },
  });

  app.use("*", cors());
  app.use("*", requestLoggerMiddleware);
  routes.registerRoutes(app);
  app.onError(globalErrorHandler);

  return app;
}
