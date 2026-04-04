import { verifyJwt } from "@/utils/auth";
import { sendError } from "@/utils/helper";
import logger from "@/utils/logger";
import type { Context, Next } from "hono";

export const authMiddleware = async (c: Context, next: Next) => {
  try {
    const authHeader = c.req.header("Authorization");

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return sendError(c, 401, "Unauthorized: No token provided");
    }

    const token = authHeader.split(" ")[1];
    if (!token) {
      return sendError(c, 401, "Unauthorized: Malformed token");
    }
    const payload = await verifyJwt(token);

    if (!payload || !payload.sub) {
      return sendError(c, 401, "Unauthorized: Invalid or expired token");
    }

    c.set("user", {
      id: Number(payload.sub),
      username: payload.username,
    });

    await next();
  } catch (err) {
    logger.error({ err }, "Authentication error");
    return sendError(c, 401, "Unauthorized");
  }
};

export default authMiddleware;
