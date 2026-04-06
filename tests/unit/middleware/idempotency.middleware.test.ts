import { mock } from "bun:test";

const mockFindFirst = mock(
  async () => null as Record<string, any> | null | undefined,
);
const mockInsertValues = mock(async () => {});
const mockInsert = mock(() => ({ values: mockInsertValues }));

const mockDb = {
  query: {
    idempotency: {
      findFirst: mockFindFirst,
    },
  },
  insert: mockInsert,
} as any;

mock.module("@/database", () => ({
  db: mockDb,
  idempotency: {
    idempotencyKey: "idempotencyKey",
    expiresAt: "expiresAt",
    response: "response",
  },
}));

mock.module("@/utils/logger", () => ({
  logger: {
    error: mock(() => {}),
    warn: mock(() => {}),
    info: mock(() => {}),
    debug: mock(() => {}),
  },
}));

import { beforeEach, describe, expect, it } from "bun:test";
import { idempotencyMiddleware } from "@/middleware/idempotency.middleware";

function makeMockContext(method: string, idempotencyHeader?: string) {
  const data: Record<string, unknown> = {};
  return {
    req: {
      method,
      header: mock((name: string) =>
        name === "x-idempotency-key" ? idempotencyHeader : undefined,
      ),
    },
    json: mock(
      (payload: unknown, status?: number) =>
        new Response(JSON.stringify(payload), { status: status ?? 200 }),
    ),
    get: mock((key: string) => data[key] ?? null),
    set: mock((key: string, value: unknown) => {
      data[key] = value;
    }),
  } as any;
}

describe("idempotencyMiddleware", () => {
  const next = mock(async () => {});

  beforeEach(() => {
    mockFindFirst.mockClear();
    mockInsert.mockClear();
    mockInsertValues.mockClear();
    next.mockClear();
  });

  it("skips idempotency logic and calls next for GET requests", async () => {
    const c = makeMockContext("GET");
    await idempotencyMiddleware(c, next);
    expect(next).toHaveBeenCalledTimes(1);
    expect(mockFindFirst).not.toHaveBeenCalled();
  });

  it("skips idempotency logic and calls next for HEAD requests", async () => {
    const c = makeMockContext("HEAD");
    await idempotencyMiddleware(c, next);
    expect(next).toHaveBeenCalledTimes(1);
    expect(mockFindFirst).not.toHaveBeenCalled();
  });

  it("skips idempotency logic and calls next for OPTIONS requests", async () => {
    const c = makeMockContext("OPTIONS");
    await idempotencyMiddleware(c, next);
    expect(next).toHaveBeenCalledTimes(1);
    expect(mockFindFirst).not.toHaveBeenCalled();
  });

  it("skips idempotency logic and calls next when no x-idempotency-key header", async () => {
    const c = makeMockContext("POST", undefined);
    await idempotencyMiddleware(c, next);
    expect(next).toHaveBeenCalledTimes(1);
    expect(mockFindFirst).not.toHaveBeenCalled();
  });

  it("returns the cached response when an existing record has a response", async () => {
    const cachedPayload = { success: true, message: "Already done" };
    mockFindFirst.mockImplementation(async () => ({
      idempotencyKey: "key-1",
      response: cachedPayload,
      expiresAt: new Date(Date.now() + 10000),
    }));
    const c = makeMockContext("POST", "key-1");
    await idempotencyMiddleware(c, next);
    expect(c.json).toHaveBeenCalledWith(cachedPayload, 200);
    expect(next).not.toHaveBeenCalled();
    expect(mockInsert).not.toHaveBeenCalled();
  });

  it("returns 409 REQUEST_IN_FLIGHT when record exists but has no response yet", async () => {
    mockFindFirst.mockImplementation(async () => ({
      idempotencyKey: "key-2",
      response: null,
      expiresAt: new Date(Date.now() + 10000),
    }));
    const c = makeMockContext("POST", "key-2");
    await idempotencyMiddleware(c, next);
    expect(c.json).toHaveBeenCalledWith(
      expect.objectContaining({ success: false }),
      409,
    );
    expect(next).not.toHaveBeenCalled();
  });

  it("inserts a new idempotency record and calls next when key is fresh", async () => {
    mockFindFirst.mockImplementation(async () => null);
    const c = makeMockContext("POST", "key-new");
    await idempotencyMiddleware(c, next);
    expect(mockInsert).toHaveBeenCalledTimes(1);
    expect(mockInsertValues).toHaveBeenCalledWith(
      expect.objectContaining({ idempotencyKey: "key-new" }),
    );
    expect(c.set).toHaveBeenCalledWith("idempotencyKey", "key-new");
    expect(next).toHaveBeenCalledTimes(1);
  });

  it("calls next on DB error and does not crash", async () => {
    mockFindFirst.mockImplementation(async () => {
      throw new Error("DB unavailable");
    });
    const c = makeMockContext("POST", "key-err");
    await idempotencyMiddleware(c, next);
    expect(next).toHaveBeenCalledTimes(1);
  });
});
