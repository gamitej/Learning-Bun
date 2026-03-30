import type { Context } from "hono";

export const AuthController = {
  login: async (c: Context) => {
    const { username, password } = await c.req.json();

    if (username === "admin" && password === "password") {
      const token = "fake-jwt-token";
      return c.json({ success: true, token }, 200);
    }

    return c.json({ success: false, message: "Invalid credentials" }, 401);
  },
};
