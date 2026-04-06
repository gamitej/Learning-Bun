import { describe, expect, it } from "bun:test";
import {
  idParamSchema,
  loginSchema,
  signupSchema,
  todoCreateSchema,
  todoUpdateSchema,
} from "@/validation";

describe("signupSchema", () => {
  it("accepts valid username and password", () => {
    const result = signupSchema.safeParse({
      username: "alice",
      password: "secret123",
    });
    expect(result.success).toBe(true);
  });

  it("rejects username shorter than 3 characters", () => {
    const result = signupSchema.safeParse({
      username: "ab",
      password: "secret123",
    });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.message).toBe(
      "Username must be at least 3 chars long",
    );
  });

  it("rejects username longer than 30 characters", () => {
    const result = signupSchema.safeParse({
      username: "a".repeat(31),
      password: "secret123",
    });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.message).toBe(
      "Username must be at most 30 chars long",
    );
  });

  it("rejects password shorter than 6 characters", () => {
    const result = signupSchema.safeParse({
      username: "alice",
      password: "abc",
    });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.message).toBe(
      "Password must be at least 6 chars long",
    );
  });

  it("rejects password longer than 50 characters", () => {
    const result = signupSchema.safeParse({
      username: "alice",
      password: "a".repeat(51),
    });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.message).toBe(
      "Password must be at most 50 chars long",
    );
  });

  it("rejects missing username field", () => {
    expect(signupSchema.safeParse({ password: "secret123" }).success).toBe(
      false,
    );
  });

  it("rejects missing password field", () => {
    expect(signupSchema.safeParse({ username: "alice" }).success).toBe(false);
  });
});

describe("loginSchema", () => {
  it("accepts valid credentials", () => {
    expect(
      loginSchema.safeParse({ username: "alice", password: "secret" }).success,
    ).toBe(true);
  });

  it("rejects empty username", () => {
    const result = loginSchema.safeParse({ username: "", password: "secret" });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.message).toBe("Username is required");
  });

  it("rejects empty password", () => {
    const result = loginSchema.safeParse({ username: "alice", password: "" });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.message).toBe("Password is required");
  });

  it("rejects missing fields", () => {
    expect(loginSchema.safeParse({}).success).toBe(false);
  });
});

describe("todoCreateSchema", () => {
  it("accepts valid task", () => {
    expect(todoCreateSchema.safeParse({ task: "buy milk" }).success).toBe(true);
  });

  it("accepts task with optional title", () => {
    expect(
      todoCreateSchema.safeParse({ task: "buy milk", title: "Shopping" })
        .success,
    ).toBe(true);
  });

  it("rejects task shorter than 3 characters", () => {
    const result = todoCreateSchema.safeParse({ task: "ab" });
    expect(result.success).toBe(false);
  });

  it("rejects when neither task nor title provided", () => {
    const result = todoCreateSchema.safeParse({});
    expect(result.success).toBe(false);
  });

  it("accepts title only (satisfies refine)", () => {
    expect(
      todoCreateSchema.safeParse({
        task: "buy some milk today",
        title: "Shopping",
      }).success,
    ).toBe(true);
  });
});

describe("todoUpdateSchema", () => {
  it("accepts title update only", () => {
    expect(todoUpdateSchema.safeParse({ title: "New title" }).success).toBe(
      true,
    );
  });

  it("accepts completed update only", () => {
    expect(todoUpdateSchema.safeParse({ completed: true }).success).toBe(true);
  });

  it("accepts both title and completed", () => {
    expect(
      todoUpdateSchema.safeParse({ title: "New title", completed: false })
        .success,
    ).toBe(true);
  });

  it("rejects empty object (no fields provided)", () => {
    const result = todoUpdateSchema.safeParse({});
    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.message).toContain("At least one field");
  });

  it("rejects empty title string", () => {
    expect(todoUpdateSchema.safeParse({ title: "" }).success).toBe(false);
  });
});

describe("idParamSchema", () => {
  it("accepts a valid positive integer", () => {
    const result = idParamSchema.safeParse({ id: 1 });
    expect(result.success).toBe(true);
    expect(result.data?.id).toBe(1);
  });

  it("coerces a numeric string to a number", () => {
    const result = idParamSchema.safeParse({ id: "42" });
    expect(result.success).toBe(true);
    expect(result.data?.id).toBe(42);
  });

  it("rejects zero", () => {
    expect(idParamSchema.safeParse({ id: 0 }).success).toBe(false);
  });

  it("rejects a negative integer", () => {
    expect(idParamSchema.safeParse({ id: -5 }).success).toBe(false);
  });

  it("rejects a non-numeric string", () => {
    expect(idParamSchema.safeParse({ id: "abc" }).success).toBe(false);
  });

  it("rejects a missing id field", () => {
    expect(idParamSchema.safeParse({}).success).toBe(false);
  });
});
