import { beforeEach, describe, expect, it, mock } from "bun:test";

const mockStoreResponse = mock(async () => {});
const mockClearRecord = mock(async () => {});

mock.module("@/utils/idempotency", () => ({
  storeResponse: mockStoreResponse,
  clearRecord: mockClearRecord,
}));

const { sendResponse, sendError } = await import("@/utils/helper");

function makeMockContext(idempotencyKey?: string) {
  const data: Record<string, unknown> = {
    idempotencyKey: idempotencyKey ?? null,
  };
  return {
    json: (payload: unknown, status?: number) =>
      new Response(JSON.stringify(payload), { status: status ?? 200 }),
    get: (key: string) => data[key] ?? null,
    set: (key: string, value: unknown) => {
      data[key] = value;
    },
  } as any;
}

describe("sendResponse", () => {
  beforeEach(() => {
    mockStoreResponse.mockClear();
  });

  it("returns a 200 response with success and message", async () => {
    const c = makeMockContext();
    const res = (await sendResponse(c, 200, true, "OK")) as Response;
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ success: true, message: "OK" });
  });

  it("includes data field in response body when data is provided", async () => {
    const c = makeMockContext();
    const res = (await sendResponse(c, 201, true, "Created", {
      id: 5,
    })) as Response;
    expect(res.status).toBe(201);
    expect(await res.json()).toEqual({
      success: true,
      message: "Created",
      data: { id: 5 },
    });
  });

  it("sets success: false in the response body", async () => {
    const c = makeMockContext();
    const res = (await sendResponse(c, 400, false, "Bad request")) as Response;
    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({
      success: false,
      message: "Bad request",
    });
  });

  it("does not include the data key when data is null", async () => {
    const c = makeMockContext();
    const res = (await sendResponse(c, 200, true, "OK")) as Response;
    const body = (await res.json()) as Record<string, unknown>;
    expect("data" in body).toBe(false);
  });

  it("calls storeResponse when an idempotency key is present", async () => {
    const c = makeMockContext("key-abc");
    await sendResponse(c, 200, true, "OK");
    expect(mockStoreResponse).toHaveBeenCalledWith("key-abc", {
      success: true,
      message: "OK",
    });
  });

  it("does not call storeResponse when no idempotency key", async () => {
    const c = makeMockContext();
    await sendResponse(c, 200, true, "OK");
    expect(mockStoreResponse).not.toHaveBeenCalled();
  });

  it("stores payload with data when idempotency key is set", async () => {
    const c = makeMockContext("key-xyz");
    await sendResponse(c, 200, true, "Got it", { items: [] });
    expect(mockStoreResponse).toHaveBeenCalledWith("key-xyz", {
      success: true,
      message: "Got it",
      data: { items: [] },
    });
  });
});

describe("sendError", () => {
  beforeEach(() => {
    mockClearRecord.mockClear();
  });

  it("returns a response with success: false and the message", async () => {
    const c = makeMockContext();
    const res = (await sendError(c, 400, "Bad input")) as Response;
    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ success: false, message: "Bad input" });
  });

  it("includes errors field when errors are provided", async () => {
    const c = makeMockContext();
    const res = (await sendError(c, 422, "Validation failed", [
      { field: "username" },
    ])) as Response;
    expect(res.status).toBe(422);
    expect(await res.json()).toEqual({
      success: false,
      message: "Validation failed",
      errors: [{ field: "username" }],
    });
  });

  it("does not include errors key when errors is null", async () => {
    const c = makeMockContext();
    const res = (await sendError(c, 500, "Error", null)) as Response;
    const body = (await res.json()) as Record<string, unknown>;
    expect("errors" in body).toBe(false);
  });

  it("includes extraMessage when provided in options", async () => {
    const c = makeMockContext();
    const res = (await sendError(c, 500, "Server error", null, {
      extraMessage: "Contact support",
    })) as Response;
    expect(res.status).toBe(500);
    const body = (await res.json()) as Record<string, unknown>;
    expect(body.extraMessage).toBe("Contact support");
  });

  it("calls clearRecord when an idempotency key is present", async () => {
    const c = makeMockContext("key-xyz");
    await sendError(c, 500, "Error");
    expect(mockClearRecord).toHaveBeenCalledWith("key-xyz");
  });

  it("does not call clearRecord when no idempotency key", async () => {
    const c = makeMockContext();
    await sendError(c, 400, "Bad input");
    expect(mockClearRecord).not.toHaveBeenCalled();
  });
});
