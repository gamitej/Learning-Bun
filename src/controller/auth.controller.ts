import { db } from "@/database";
import { UserHelpers } from "@/database/schema";
import { signJwt } from "@/utils/auth";
import { sendError, sendResponse } from "@/utils/helper";
import logger from "@/utils/logger";
import type { Context } from "hono";

export const AuthController = {
  /**
   * =================== SIGNUP ===================
   */
  signup: async (c: Context) => {
    try {
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
    } catch (err: unknown) {
      const code =
        err && typeof err === "object" && "code" in err
          ? (err as { code?: string }).code
          : undefined;
      if (code === "23505") {
        return sendError(c, 409, "Username already exists");
      }

      const msg = err instanceof Error ? err.message : String(err);
      logger.error({ err: msg }, "Signup failed");
      return sendError(c, 500, "Signup failed");
    }
  },

  /**
   * =================== LOGIN ====================
   */
  login: async (c: Context) => {
    try {
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
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      logger.error({ err: msg }, "Login failed");
      return sendError(c, 500, "Login failed");
    }
  },
};
