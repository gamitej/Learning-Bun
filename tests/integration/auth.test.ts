import {
  afterAll,
  beforeEach,
  describe,
  expect,
  it,
  mock,
  spyOn,
} from "bun:test";

// ── Mocks (declared before any imports so Bun can hoist them) ─────────────

mock.module("@/utils/logger", () => {
  const noOp = () => {};
  const child = () => ({ info: noOp, warn: noOp, error: noOp, debug: noOp });
  return {
    logger: { info: noOp, warn: noOp, error: noOp, debug: noOp, child },
  };
});

// ── Imports ───────────────────────────────────────────────────────────────

import { createApp } from "@/app";
import { UserHelpers } from "@/database/schema";
import { Errors } from "@/utils/errors";

// ── App Setup ─────────────────────────────────────────────────────────────

const app = createApp();

// ── Helpers ───────────────────────────────────────────────────────────────

const mockCreate = spyOn(UserHelpers, "create") as any;
const mockVerify = spyOn(UserHelpers, "verify") as any;

afterAll(() => {
  mockCreate.mockRestore();
  mockVerify.mockRestore();
});

function post(body: unknown) {
  return {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  };
}

async function json(res: Response) {
  return res.json() as Promise<Record<string, any>>;
}

// ── Tests ─────────────────────────────────────────────────────────────────

describe("POST /api/auth/signup", () => {
  beforeEach(() => {
    mockCreate.mockReset();
    mockVerify.mockReset();
  });

  it("returns 201 with user data on successful signup", async () => {
    mockCreate.mockResolvedValueOnce({ id: 1, username: "alice" });

    const res = await app.request(
      "/api/auth/signup",
      post({ username: "alice", password: "secret123" }),
    );

    expect(res.status).toBe(201);
    const body = await json(res);
    expect(body.success).toBe(true);
    expect(body.data.id).toBe(1);
    expect(body.data.username).toBe("alice");
  });

  it("returns 500 when user creation returns null", async () => {
    mockCreate.mockResolvedValueOnce(null);

    const res = await app.request(
      "/api/auth/signup",
      post({ username: "alice", password: "secret123" }),
    );

    expect(res.status).toBe(500);
    const body = await json(res);
    expect(body.success).toBe(false);
    expect(body.message).toBe(Errors.USER_CREATION_FAILED.message);
  });

  it("returns 409 when username already exists (duplicate key)", async () => {
    mockCreate.mockRejectedValueOnce(
      Object.assign(new Error("duplicate key"), { code: "23505" }),
    );

    const res = await app.request(
      "/api/auth/signup",
      post({ username: "alice", password: "secret123" }),
    );

    expect(res.status).toBe(409);
    const body = await json(res);
    expect(body.success).toBe(false);
    expect(body.message).toBe(Errors.DUPLICATE_RECORD.message);
  });

  it("returns 400 when username is too short", async () => {
    const res = await app.request(
      "/api/auth/signup",
      post({ username: "ab", password: "secret123" }),
    );

    expect(res.status).toBe(400);
    expect((await json(res)).success).toBe(false);
  });

  it("returns 400 when username exceeds 30 characters", async () => {
    const res = await app.request(
      "/api/auth/signup",
      post({ username: "a".repeat(31), password: "secret123" }),
    );

    expect(res.status).toBe(400);
    expect((await json(res)).success).toBe(false);
  });

  it("returns 400 when password is too short", async () => {
    const res = await app.request(
      "/api/auth/signup",
      post({ username: "alice", password: "abc" }),
    );

    expect(res.status).toBe(400);
    expect((await json(res)).success).toBe(false);
  });

  it("returns 400 when required fields are missing", async () => {
    const res = await app.request(
      "/api/auth/signup",
      post({ username: "alice" }),
    );

    expect(res.status).toBe(400);
    expect((await json(res)).success).toBe(false);
  });

  it("returns 400 when body is empty", async () => {
    const res = await app.request("/api/auth/signup", post({}));

    expect(res.status).toBe(400);
    expect((await json(res)).success).toBe(false);
  });
});

describe("POST /api/auth/login", () => {
  beforeEach(() => {
    mockCreate.mockReset();
    mockVerify.mockReset();
  });

  it("returns 200 with a JWT token on valid credentials", async () => {
    mockVerify.mockResolvedValueOnce({ id: 1, username: "alice" });

    const res = await app.request(
      "/api/auth/login",
      post({ username: "alice", password: "secret123" }),
    );

    expect(res.status).toBe(200);
    const body = await json(res);
    expect(body.success).toBe(true);
    expect(typeof body.data.token).toBe("string");
    expect(body.data.token.split(".")).toHaveLength(3); // valid JWT structure
  });

  it("returns 401 when credentials are invalid", async () => {
    mockVerify.mockResolvedValueOnce(null);

    const res = await app.request(
      "/api/auth/login",
      post({ username: "alice", password: "wrongpassword" }),
    );

    expect(res.status).toBe(401);
    const body = await json(res);
    expect(body.success).toBe(false);
    expect(body.message).toBe(Errors.INVALID_CREDENTIALS.message);
  });

  it("returns 400 when username is empty", async () => {
    const res = await app.request(
      "/api/auth/login",
      post({ username: "", password: "secret123" }),
    );

    expect(res.status).toBe(400);
    expect((await json(res)).success).toBe(false);
  });

  it("returns 400 when password is missing", async () => {
    const res = await app.request(
      "/api/auth/login",
      post({ username: "alice" }),
    );

    expect(res.status).toBe(400);
    expect((await json(res)).success).toBe(false);
  });

  it("returns 400 when body is empty", async () => {
    const res = await app.request("/api/auth/login", post({}));

    expect(res.status).toBe(400);
    expect((await json(res)).success).toBe(false);
  });
});
