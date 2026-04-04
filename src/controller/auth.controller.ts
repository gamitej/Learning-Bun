import { db } from "@/database";
import { UserHelpers } from "@/database/schema";
import { signJwt } from "@/utils/auth";
import { sendError, sendResponse } from "@/utils/helper";
import logger from "@/utils/logger";
import type { Handler } from "hono";

export const AuthController = {
  /**
   * =================== SIGNUP ===================
   */
  signup: (async (c) => {
    const { username, password } = await c.req.json();

    if (!username || !password) {
      return sendError(c, 400, "Missing username or password");
    }

    const user = await UserHelpers.create(db, {
      username,
      passwordRaw: password,
    });

    if (!user) {
      return sendError(c, 500, "Failed to create user");
    }

    logger.info({ userId: user.id, username: user.username }, "User created");

    return sendResponse(c, 201, true, "User created successfully", {
      id: user.id,
      username: user.username,
    });
  }) as Handler,

  /**
   * =================== LOGIN ====================
   */
  login: (async (c) => {
    const { username, password } = await c.req.json();

    if (!username || !password) {
      return sendError(c, 400, "Missing username or password");
    }

    const user = await UserHelpers.verify(db, username, password);

    if (!user) {
      logger.warn({ username }, "Invalid login attempt");
      return sendError(c, 401, "Invalid credentials");
    }

    const token = await signJwt({ sub: user.id, username: user.username });

    logger.info({ userId: user.id }, "User logged in");

    return sendResponse(c, 200, true, "Login successful", { token });
  }) as Handler,
};
