import { env } from "@/config/env";
import { sign, verify } from "hono/jwt";

/**
 * JWT Utilities
 */
export async function signJwt(payload: Record<string, any>, expiresIn = 3600) {
  const now = Math.floor(Date.now() / 1000);

  return await sign(
    {
      ...payload,
      iat: now,
      exp: now + expiresIn,
    },
    env.JWT_SECRET,
  );
}

export async function verifyJwt(token: string) {
  try {
    return await verify(token, env.JWT_SECRET, "HS256");
  } catch (err) {
    return null;
  }
}

/**
 * Password Utilities
 */
export async function hashPassword(password: string) {
  return await Bun.password.hash(password, {
    algorithm: "bcrypt",
    cost: 10,
  });
}

export async function verifyPassword(password: string, hash: string) {
  return await Bun.password.verify(password, hash);
}
