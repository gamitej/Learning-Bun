import { afterAll, beforeAll, describe, expect, it, mock } from "bun:test";

// ── Mocks ─────────────────────────────────────────────────────────────────

mock.module("@/utils/logger", () => {
  const noOp = () => {};
  const child = () => ({ info: noOp, warn: noOp, error: noOp, debug: noOp });
  return {
    logger: { info: noOp, warn: noOp, error: noOp, debug: noOp, child },
  };
});

// ── Imports ───────────────────────────────────────────────────────────────

import { createApp } from "@/app";
import { getDb, startDatabase, stopDatabase } from "@/database";
import { todos, users } from "@/database/schema";
import { Errors } from "@/utils/errors";
import { createTestTodo, json, jsonReq, setupTestContext } from "./helpers";

// ── App Setup ─────────────────────────────────────────────────────────────

const app = createApp();

// ── Test Helpers ──────────────────────────────────────────────────────────

let authHeader: string;
let userId: number;
let authed: Awaited<ReturnType<typeof setupTestContext>>["authed"];

beforeAll(async () => {
  await startDatabase();
  await getDb().delete(todos);
  const ctx = await setupTestContext("alice");
  userId = ctx.user.id;
  authHeader = ctx.authHeader;
  authed = ctx.authed;
});

afterAll(async () => {
  await getDb().delete(todos);
  await getDb().delete(users);
  await stopDatabase();
});

// ── Tests: GET /api/todos ─────────────────────────────────────────────────

describe("GET /api/todos", () => {
  it("returns 401 when no Authorization header is provided", async () => {
    const res = await app.request("/api/todos");
    expect(res.status).toBe(401);
    expect((await json(res)).success).toBe(false);
  });

  it("returns 401 when token is malformed", async () => {
    const res = await app.request("/api/todos", {
      headers: { Authorization: "Basic not-a-jwt" },
    });
    expect(res.status).toBe(401);
  });

  it("returns 200 with an empty array when the user has no todos", async () => {
    const res = await app.request("/api/todos", authed("GET"));

    expect(res.status).toBe(200);
    const body = await json(res);
    expect(body.success).toBe(true);
    expect(body.data).toEqual([]);
  });

  it("returns 200 with all todos belonging to the authenticated user", async () => {
    await getDb()
      .insert(todos)
      .values([
        { title: "Buy milk", completed: false, user_id: userId },
        { title: "Walk dog", completed: true, user_id: userId },
      ]);

    const res = await app.request("/api/todos", authed("GET"));

    expect(res.status).toBe(200);
    const body = await json(res);
    expect(body.success).toBe(true);
    expect(body.data).toHaveLength(2);
    expect(body.data[0].title).toBe("Buy milk");
    expect(body.data[1].title).toBe("Walk dog");

    await getDb().delete(todos);
  });
});

// ── Tests: POST /api/todos ────────────────────────────────────────────────

describe("POST /api/todos", () => {
  it("returns 401 when no Authorization header is provided", async () => {
    const res = await app.request(
      "/api/todos",
      jsonReq("POST", { title: "Buy milk" }),
    );
    expect(res.status).toBe(401);
  });

  it("returns 201 and uses title over task when both are provided", async () => {
    const res = await app.request(
      "/api/todos",
      authed("POST", { task: "item", title: "Buy milk" }),
    );

    expect(res.status).toBe(201);
    const body = await json(res);
    expect(body.success).toBe(true);
    expect(body.data.title).toBe("Buy milk");
  });

  it("returns 201 with the created todo when using the task field", async () => {
    const res = await app.request(
      "/api/todos",
      authed("POST", { task: "Walk dog" }),
    );

    expect(res.status).toBe(201);
    expect((await json(res)).data.title).toBe("Walk dog");
  });

  it("returns 400 when neither title nor task is provided", async () => {
    const res = await app.request("/api/todos", authed("POST", {}));

    expect(res.status).toBe(400);
    expect((await json(res)).success).toBe(false);
  });

  it("returns 400 when title is below the minimum length", async () => {
    const res = await app.request(
      "/api/todos",
      authed("POST", { title: "ab" }),
    );

    expect(res.status).toBe(400);
    expect((await json(res)).success).toBe(false);
  });
});

// ── Tests: GET /api/todos/:id ─────────────────────────────────────────────

describe("GET /api/todos/:id", () => {
  let todoId: number;

  beforeAll(async () => {
    const todo = await createTestTodo(userId, { title: "Buy milk" });
    todoId = todo.id;
  });

  afterAll(async () => {
    await getDb().delete(todos);
  });

  it("returns 401 when not authenticated", async () => {
    const res = await app.request(`/api/todos/${todoId}`);
    expect(res.status).toBe(401);
  });

  it("returns 200 with the matching todo", async () => {
    const res = await app.request(`/api/todos/${todoId}`, authed("GET"));

    expect(res.status).toBe(200);
    const body = await json(res);
    expect(body.success).toBe(true);
    expect(body.data.title).toBe("Buy milk");
    expect(body.data.user_id).toBe(userId);
  });

  it("returns 404 when no matching todo exists", async () => {
    const res = await app.request("/api/todos/999999", authed("GET"));

    expect(res.status).toBe(404);
    expect((await json(res)).message).toBe(Errors.TODO_NOT_FOUND.message);
  });

  it("returns 400 when the id param is not a valid number", async () => {
    const res = await app.request("/api/todos/abc", authed("GET"));
    expect(res.status).toBe(400);
  });

  it("returns 400 when the id param is not a positive integer", async () => {
    const res = await app.request("/api/todos/-1", authed("GET"));
    expect(res.status).toBe(400);
  });
});

// ── Tests: PUT /api/todos/:id ─────────────────────────────────────────────

describe("PUT /api/todos/:id", () => {
  let todoId: number;

  beforeAll(async () => {
    const todo = await createTestTodo(userId, { title: "Buy milk" });
    todoId = todo.id;
  });

  afterAll(async () => {
    await getDb().delete(todos);
  });

  it("returns 401 when not authenticated", async () => {
    const res = await app.request(
      `/api/todos/${todoId}`,
      jsonReq("PUT", { title: "Updated" }),
    );
    expect(res.status).toBe(401);
  });

  it("returns 200 with the updated todo when changing title", async () => {
    const res = await app.request(
      `/api/todos/${todoId}`,
      authed("PUT", { title: "Buy oat milk" }),
    );

    expect(res.status).toBe(200);
    const body = await json(res);
    expect(body.success).toBe(true);
    expect(body.data.title).toBe("Buy oat milk");
  });

  it("returns 200 when marking a todo as completed", async () => {
    const res = await app.request(
      `/api/todos/${todoId}`,
      authed("PUT", { completed: true }),
    );

    expect(res.status).toBe(200);
    expect((await json(res)).data.completed).toBe(true);
  });

  it("returns 404 when the todo does not exist", async () => {
    const res = await app.request(
      "/api/todos/999999",
      authed("PUT", { title: "Updated" }),
    );

    expect(res.status).toBe(404);
    expect((await json(res)).message).toBe(Errors.TODO_NOT_FOUND.message);
  });

  it("returns 400 when the update body contains no valid fields", async () => {
    const res = await app.request(`/api/todos/${todoId}`, authed("PUT", {}));

    expect(res.status).toBe(400);
    expect((await json(res)).success).toBe(false);
  });

  it("returns 400 when the id param is not a valid number", async () => {
    const res = await app.request(
      "/api/todos/xyz",
      authed("PUT", { title: "Updated" }),
    );
    expect(res.status).toBe(400);
  });
});

// ── Tests: DELETE /api/todos/:id ──────────────────────────────────────────

describe("DELETE /api/todos/:id", () => {
  let todoId: number;

  beforeAll(async () => {
    const todo = await createTestTodo(userId, { title: "Buy milk" });
    todoId = todo.id;
  });

  afterAll(async () => {
    await getDb().delete(todos);
  });

  it("returns 401 when not authenticated", async () => {
    const res = await app.request(`/api/todos/${todoId}`, { method: "DELETE" });
    expect(res.status).toBe(401);
  });

  it("returns 200 with the deleted todo", async () => {
    const res = await app.request(`/api/todos/${todoId}`, authed("DELETE"));

    expect(res.status).toBe(200);
    const body = await json(res);
    expect(body.success).toBe(true);
    expect(body.data.title).toBe("Buy milk");
    expect(body.data.user_id).toBe(userId);
  });

  it("returns 404 when the todo does not exist", async () => {
    const res = await app.request("/api/todos/999999", authed("DELETE"));

    expect(res.status).toBe(404);
    expect((await json(res)).message).toBe(Errors.TODO_NOT_FOUND.message);
  });

  it("returns 400 when the id param is not a valid number", async () => {
    const res = await app.request("/api/todos/abc", authed("DELETE"));
    expect(res.status).toBe(400);
  });
});
