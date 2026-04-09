import { beforeAll, beforeEach, describe, expect, it, mock } from "bun:test";

// ── DB mock state (module-level, read lazily via closures) ────────────────
// The closure inside makeChain reads this at *test execution* time (after
// module initialisation), so there is no temporal dead-zone issue.

let dbResult: unknown = [];

// ── Function declarations are JS-hoisted, so they are available when the
//    mock.module factories run (which happens before regular module code). ──

// biome-ignore lint/style/useConst: reassigned in beforeEach
function makeChain(): unknown {
  const proxy: Record<string | symbol, unknown> = new Proxy(
    {} as Record<string, unknown>,
    {
      get(_target, prop) {
        if (prop === "then") {
          return (
            resolve: (v: unknown) => unknown,
            reject: (e: unknown) => unknown,
          ) => Promise.resolve(dbResult).then(resolve, reject);
        }
        if (prop === "catch") {
          return (reject: (e: unknown) => unknown) =>
            Promise.resolve(dbResult).catch(reject);
        }
        if (prop === "finally") {
          return (fin: () => void) => Promise.resolve(dbResult).finally(fin);
        }
        // All other property accesses (from(), where(), limit(), values(),
        // returning(), set(), etc.) return a function that returns the same proxy,
        // enabling unlimited method chaining.
        return (..._args: unknown[]) => proxy;
      },
    },
  );
  return proxy;
}

function makeTableProxy(): unknown {
  return new Proxy({} as Record<string, unknown>, {
    get(): unknown {
      return makeTableProxy();
    },
  });
}

// ── Mocks ─────────────────────────────────────────────────────────────────

mock.module("@/utils/logger", () => {
  const noOp = () => {};
  const child = () => ({ info: noOp, warn: noOp, error: noOp, debug: noOp });
  return {
    logger: { info: noOp, warn: noOp, error: noOp, debug: noOp, child },
  };
});

mock.module("@/utils/idempotency", () => ({
  storeResponse: mock(async () => {}),
  clearRecord: mock(async () => {}),
}));

mock.module("@/database/schema", () => ({
  UserHelpers: {
    create: mock(async () => null),
    verify: mock(async () => null),
  },
  users: {},
  todos: {},
  idempotency: {},
}));

mock.module("@/database", () => ({
  db: {
    select: makeChain,
    insert: makeChain,
    update: makeChain,
    delete: makeChain,
    execute: makeChain,
  },
  getDb: () => ({ execute: makeChain }),
  startDatabase: async () => {},
  stopDatabase: async () => {},
  todos: makeTableProxy(),
  users: makeTableProxy(),
  idempotency: makeTableProxy(),
}));

// ── Imports ───────────────────────────────────────────────────────────────

import { createApp } from "@/app";
import { signJwt } from "@/utils/auth";
import { Errors } from "@/utils/errors";

// ── App Setup ─────────────────────────────────────────────────────────────

const app = createApp();

// ── Test Helpers ──────────────────────────────────────────────────────────

let authHeader: string;

beforeAll(async () => {
  const token = await signJwt({ sub: "1", username: "alice" });
  authHeader = `Bearer ${token}`;
});

beforeEach(() => {
  dbResult = [];
});

/** Unsigned request with JSON body */
function jsonReq(method: string, body?: unknown) {
  return {
    method,
    headers: { "Content-Type": "application/json" },
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
  };
}

/** Authenticated request with optional JSON body */
function authed(method: string, body?: unknown) {
  return {
    method,
    headers: {
      "Content-Type": "application/json",
      Authorization: authHeader,
    },
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
  };
}

const TODO = { id: 1, title: "Buy milk", completed: false, user_id: 1 };

async function json(res: Response) {
  return res.json() as Promise<Record<string, any>>;
}

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
    dbResult = [];
    const res = await app.request("/api/todos", authed("GET"));

    expect(res.status).toBe(200);
    const body = await json(res);
    expect(body.success).toBe(true);
    expect(body.data).toEqual([]);
  });

  it("returns 200 with all todos belonging to the authenticated user", async () => {
    const todos = [
      { id: 1, title: "Buy milk", completed: false, user_id: 1 },
      { id: 2, title: "Walk dog", completed: true, user_id: 1 },
    ];
    dbResult = todos;
    const res = await app.request("/api/todos", authed("GET"));

    expect(res.status).toBe(200);
    const body = await json(res);
    expect(body.success).toBe(true);
    expect(body.data).toEqual(todos);
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
    dbResult = [TODO];
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
    const created = { id: 2, title: "Walk dog", completed: false, user_id: 1 };
    dbResult = [created];
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

  it("returns 500 when the database insert returns no rows", async () => {
    dbResult = []; // empty means insert failed to return a record
    const res = await app.request(
      "/api/todos",
      authed("POST", { task: "Buy milk" }),
    );

    expect(res.status).toBe(500);
    expect((await json(res)).message).toBe(
      Errors.TODO_CREATION_FAILED.message,
    );
  });
});

// ── Tests: GET /api/todos/:id ─────────────────────────────────────────────

describe("GET /api/todos/:id", () => {
  it("returns 401 when not authenticated", async () => {
    const res = await app.request("/api/todos/1");
    expect(res.status).toBe(401);
  });

  it("returns 200 with the matching todo", async () => {
    dbResult = [TODO];
    const res = await app.request("/api/todos/1", authed("GET"));

    expect(res.status).toBe(200);
    const body = await json(res);
    expect(body.success).toBe(true);
    expect(body.data).toEqual(TODO);
  });

  it("returns 404 when no matching todo exists", async () => {
    dbResult = [];
    const res = await app.request("/api/todos/999", authed("GET"));

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
  it("returns 401 when not authenticated", async () => {
    const res = await app.request(
      "/api/todos/1",
      jsonReq("PUT", { title: "Updated" }),
    );
    expect(res.status).toBe(401);
  });

  it("returns 200 with the updated todo when changing title", async () => {
    const updated = { ...TODO, title: "Buy oat milk" };
    dbResult = [updated];
    const res = await app.request(
      "/api/todos/1",
      authed("PUT", { title: "Buy oat milk" }),
    );

    expect(res.status).toBe(200);
    const body = await json(res);
    expect(body.success).toBe(true);
    expect(body.data.title).toBe("Buy oat milk");
  });

  it("returns 200 when marking a todo as completed", async () => {
    const updated = { ...TODO, completed: true };
    dbResult = [updated];
    const res = await app.request(
      "/api/todos/1",
      authed("PUT", { completed: true }),
    );

    expect(res.status).toBe(200);
    expect((await json(res)).data.completed).toBe(true);
  });

  it("returns 404 when the todo does not exist", async () => {
    dbResult = [];
    const res = await app.request(
      "/api/todos/999",
      authed("PUT", { title: "Updated" }),
    );

    expect(res.status).toBe(404);
    expect((await json(res)).message).toBe(Errors.TODO_NOT_FOUND.message);
  });

  it("returns 400 when the update body contains no valid fields", async () => {
    const res = await app.request("/api/todos/1", authed("PUT", {}));

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
  it("returns 401 when not authenticated", async () => {
    const res = await app.request("/api/todos/1", { method: "DELETE" });
    expect(res.status).toBe(401);
  });

  it("returns 200 with the deleted todo", async () => {
    dbResult = [TODO];
    const res = await app.request("/api/todos/1", authed("DELETE"));

    expect(res.status).toBe(200);
    const body = await json(res);
    expect(body.success).toBe(true);
    expect(body.data).toEqual(TODO);
  });

  it("returns 404 when the todo does not exist", async () => {
    dbResult = [];
    const res = await app.request("/api/todos/999", authed("DELETE"));

    expect(res.status).toBe(404);
    expect((await json(res)).message).toBe(Errors.TODO_NOT_FOUND.message);
  });

  it("returns 400 when the id param is not a valid number", async () => {
    const res = await app.request("/api/todos/abc", authed("DELETE"));
    expect(res.status).toBe(400);
  });
});
