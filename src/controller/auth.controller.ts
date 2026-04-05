import { db } from "@/database";
import { UserHelpers } from "@/database/schema";
import type { loginRoute, signupRoute } from "@/routes/auth.routes";
import { signJwt } from "@/utils/auth";
import { Errors } from "@/utils/errors";
import { sendError, sendResponse } from "@/utils/helper";
import { logger } from "@/utils/logger";
import type { RouteHandler } from "@hono/zod-openapi";

export const AuthController = {
  /**
   * =================== SIGNUP ===================
   */
  signup: (async (c) => {
    const { username, password } = c.req.valid("json");

    const user = await UserHelpers.create(db, {
      username,
      passwordRaw: password,
    });

    if (!user) {
      return sendError(
        c,
        Errors.USER_CREATION_FAILED.status,
        Errors.USER_CREATION_FAILED.message,
      );
    }

    logger.info({ userId: user.id, username: user.username }, "User created");

    return sendResponse(c, 201, true, "User created successfully", {
      id: user.id,
      username: user.username,
    });
  }) as RouteHandler<typeof signupRoute>,

  /**
   * =================== LOGIN ====================
   */
  login: (async (c) => {
    const { username, password } = c.req.valid("json");

    const user = await UserHelpers.verify(db, username, password);

    if (!user) {
      logger.warn({ username }, "Invalid login attempt");
      return sendError(
        c,
        Errors.INVALID_CREDENTIALS.status,
        Errors.INVALID_CREDENTIALS.message,
      );
    }

    const token = await signJwt({ sub: user.id, username: user.username });

    logger.info({ userId: user.id }, "User logged in");

    return sendResponse(c, 200, true, "Login successful", { token });
  }) as RouteHandler<typeof loginRoute>,
};
