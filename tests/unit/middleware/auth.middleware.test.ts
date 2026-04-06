import { beforeEach, describe, expect, it, mock } from "bun:test";

mock.module("@/config/env", () => ({
  env: {
    JWT_SECRET: "test-secret-key-that-is-at-least-32-chars-long",
    NODE_ENV: "test",
    PORT: 3000,
    DATABASE_URL: "postgres://test:test@localhost:5432/test",
    IDEMPOTENCY_EXPIRES_HOURS: 24,
    LOG_LEVEL: "info",
  },
}));

mock.module("@/utils/idempotency", () => ({
  storeResponse: mock(async () => {}),
  clearRecord: mock(async () => {}),
}));

mock.module("@/utils/logger", () => ({
  logger: {
    error: mock(() => {}),
    warn: mock(() => {}),
    info: mock(() => {}),
    debug: mock(() => {}),
  },
}));

import { authMiddleware } from "@/middleware/auth.middleware";
import { signJwt } from "@/utils/auth";

function makeMockContext(authHeader?: string) {
  const data: Record<string, unknown> = {};
  return {
    req: {
      header: (name: string) =>
        name === "Authorization" ? authHeader : undefined,
    },
    json: (payload: unknown, status?: number) =>
      new Response(JSON.stringify(payload), { status: status ?? 200 }),
    get: (key: string) => data[key] ?? null,
    set: mock((key: string, value: unknown) => {
      data[key] = value;
    }),
  } as any;
}

describe("authMiddleware", () => {
  const next = mock(async () => {});

  beforeEach(() => {
    next.mockClear();
  });

  it("returns 401 when Authorization header is missing", async () => {
    const c = makeMockContext(undefined);
    const res = (await authMiddleware(c, next)) as Response;
    expect(res.status).toBe(401);
    expect(next).not.toHaveBeenCalled();
  });

  it("returns 401 when header does not start with 'Bearer '", async () => {
    const c = makeMockContext("Basic c29tZXRva2Vu");
    const res = (await authMiddleware(c, next)) as Response;
    expect(res.status).toBe(401);
    expect(next).not.toHaveBeenCalled();
  });

  it("returns 401 when token is not a valid JWT", async () => {
    const c = makeMockContext("Bearer not.a.valid.jwt");
    const res = (await authMiddleware(c, next)) as Response;
    expect(res.status).toBe(401);
    expect(next).not.toHaveBeenCalled();
  });

  it("returns 401 when JWT payload has no sub claim", async () => {
    const token = await signJwt({ username: "alice" }); // no sub
    const c = makeMockContext(`Bearer ${token}`);
    const res = (await authMiddleware(c, next)) as Response;
    expect(res.status).toBe(401);
    expect(next).not.toHaveBeenCalled();
  });

  it("sets user context and calls next when token is valid", async () => {
    const token = await signJwt({ sub: "42", username: "alice" });
    const c = makeMockContext(`Bearer ${token}`);
    await authMiddleware(c, next);
    expect(c.set).toHaveBeenCalledWith("user", { id: 42, username: "alice" });
    expect(next).toHaveBeenCalledTimes(1);
  });

  it("converts sub to a number when setting the user", async () => {
    const token = await signJwt({ sub: "7", username: "bob" });
    const c = makeMockContext(`Bearer ${token}`);
    await authMiddleware(c, next);
    const setCall = (c.set.mock.calls as any[]).find(
      ([key]: [string]) => key === "user",
    );
    expect(setCall?.[1]).toEqual({ id: 7, username: "bob" });
  });

  it("returns 401 when the token is expired", async () => {
    const token = await signJwt({ sub: "1" }, -10);
    const c = makeMockContext(`Bearer ${token}`);
    const res = (await authMiddleware(c, next)) as Response;
    expect(res.status).toBe(401);
    expect(next).not.toHaveBeenCalled();
  });
});
