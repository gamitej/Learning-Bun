import { describe, expect, it, mock } from "bun:test";

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

import { Errors, globalErrorHandler } from "@/utils/errors";

function makeMockContext() {
  return {
    req: { path: "/test" },
    json: (payload: unknown, status?: number) =>
      new Response(JSON.stringify(payload), { status: status ?? 200 }),
    get: (_key: string) => null,
    set: () => {},
  } as any;
}

describe("Errors constants", () => {
  it("UNAUTHORIZED has the correct status and message", () => {
    expect(Errors.UNAUTHORIZED.status).toBe(401);
    expect(Errors.UNAUTHORIZED.message).toBe("Unauthorized");
  });

  it("NO_TOKEN has status 401", () => {
    expect(Errors.NO_TOKEN.status).toBe(401);
    expect(Errors.NO_TOKEN.message).toBe("Unauthorized: No token provided");
  });

  it("MALFORMED_TOKEN has status 401", () => {
    expect(Errors.MALFORMED_TOKEN.status).toBe(401);
  });

  it("INVALID_TOKEN has status 401", () => {
    expect(Errors.INVALID_TOKEN.status).toBe(401);
  });

  it("INVALID_CREDENTIALS has status 401", () => {
    expect(Errors.INVALID_CREDENTIALS.status).toBe(401);
  });

  it("VALIDATION_FAILED has status 400", () => {
    expect(Errors.VALIDATION_FAILED.status).toBe(400);
  });

  it("INVALID_ID has status 400", () => {
    expect(Errors.INVALID_ID.status).toBe(400);
  });

  it("NO_FIELDS_TO_UPDATE has status 400", () => {
    expect(Errors.NO_FIELDS_TO_UPDATE.status).toBe(400);
  });

  it("TODO_NOT_FOUND has status 404", () => {
    expect(Errors.TODO_NOT_FOUND.status).toBe(404);
  });

  it("TODO_CREATION_FAILED has status 500", () => {
    expect(Errors.TODO_CREATION_FAILED.status).toBe(500);
  });

  it("DUPLICATE_RECORD has status 409", () => {
    expect(Errors.DUPLICATE_RECORD.status).toBe(409);
  });

  it("DB_VALIDATION_FAILED has status 400", () => {
    expect(Errors.DB_VALIDATION_FAILED.status).toBe(400);
  });

  it("REQUEST_IN_FLIGHT has status 409", () => {
    expect(Errors.REQUEST_IN_FLIGHT.status).toBe(409);
  });

  it("INTERNAL has status 500", () => {
    expect(Errors.INTERNAL.status).toBe(500);
  });
});

describe("globalErrorHandler", () => {
  it("handles postgres duplicate key error (code 23505)", async () => {
    const c = makeMockContext();
    const err = Object.assign(new Error("duplicate key value"), {
      code: "23505",
    });
    const res = (await globalErrorHandler(err, c)) as Response;
    expect(res.status).toBe(Errors.DUPLICATE_RECORD.status);
  });

  it("handles postgres check constraint error (code 23514)", async () => {
    const c = makeMockContext();
    const err = Object.assign(new Error("check constraint violation"), {
      code: "23514",
    });
    const res = (await globalErrorHandler(err, c)) as Response;
    expect(res.status).toBe(Errors.DB_VALIDATION_FAILED.status);
  });

  it("falls through to INTERNAL for an unknown error", async () => {
    const c = makeMockContext();
    const err = new Error("something unexpected");
    const res = (await globalErrorHandler(err, c)) as Response;
    expect(res.status).toBe(Errors.INTERNAL.status);
  });

  it("falls through to INTERNAL when no error code is present", async () => {
    const c = makeMockContext();
    const err = new Error("generic error");
    const res = (await globalErrorHandler(err, c)) as Response;
    expect(res.status).toBe(500);
  });

  it("response body has success: false", async () => {
    const c = makeMockContext();
    const err = new Error("oops");
    const res = (await globalErrorHandler(err, c)) as Response;
    const body = (await res.json()) as Record<string, unknown>;
    expect(body.success).toBe(false);
  });
});
