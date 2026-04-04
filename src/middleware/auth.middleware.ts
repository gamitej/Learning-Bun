import { verifyJwt } from "@/utils/auth";
import { Errors } from "@/utils/errors";
import { sendError } from "@/utils/helper";
import { logger } from "@/utils/logger";
import type { Context, Next } from "hono";

export const authMiddleware = async (c: Context, next: Next) => {
  try {
    const authHeader = c.req.header("Authorization");

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return sendError(c, Errors.NO_TOKEN.status, Errors.NO_TOKEN.message);
    }

    const token = authHeader.split(" ")[1];
    if (!token) {
      return sendError(
        c,
        Errors.MALFORMED_TOKEN.status,
        Errors.MALFORMED_TOKEN.message,
      );
    }
    const payload = await verifyJwt(token);

    if (!payload || !payload.sub) {
      return sendError(
        c,
        Errors.INVALID_TOKEN.status,
        Errors.INVALID_TOKEN.message,
      );
    }

    c.set("user", {
      id: Number(payload.sub),
      username: payload.username,
    });

    await next();
  } catch (err) {
    logger.error({ err }, "Authentication error");
    return sendError(
      c,
      Errors.UNAUTHORIZED.status,
      Errors.UNAUTHORIZED.message,
    );
  }
};

export default authMiddleware;
