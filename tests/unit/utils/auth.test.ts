import { describe, expect, it } from "bun:test";
import { hashPassword, signJwt, verifyJwt, verifyPassword } from "@/utils/auth";

describe("signJwt", () => {
  it("returns a JWT string with three dot-separated parts", async () => {
    const token = await signJwt({ sub: "1", username: "alice" });
    expect(typeof token).toBe("string");
    expect(token.split(".")).toHaveLength(3);
  });

  it("embeds payload fields verifiable via verifyJwt", async () => {
    const token = await signJwt({ sub: "42", username: "bob" });
    const payload = await verifyJwt(token);
    expect(payload?.sub).toBe("42");
    expect(payload?.username).toBe("bob");
  });

  it("sets iat and exp claims", async () => {
    const before = Math.floor(Date.now() / 1000);
    const token = await signJwt({ sub: "1" }, 3600);
    const payload = await verifyJwt(token);
    const after = Math.floor(Date.now() / 1000);
    expect(payload?.iat).toBeGreaterThanOrEqual(before);
    expect(payload?.iat).toBeLessThanOrEqual(after);
    expect(payload?.exp).toBeGreaterThan(before + 3500);
  });

  it("respects a custom expiresIn value", async () => {
    const token = await signJwt({ sub: "1" }, 7200);
    const payload = await verifyJwt(token);
    const now = Math.floor(Date.now() / 1000);
    expect(payload?.exp).toBeGreaterThan(now + 7000);
  });
});

describe("verifyJwt", () => {
  it("returns the payload for a valid token", async () => {
    const token = await signJwt({ sub: "1", username: "alice" });
    const payload = await verifyJwt(token);
    expect(payload).not.toBeNull();
    expect(payload?.sub).toBe("1");
    expect(payload?.username).toBe("alice");
  });

  it("returns null for a completely invalid token string", async () => {
    expect(await verifyJwt("not.a.valid.token")).toBeNull();
  });

  it("returns null for a tampered token signature", async () => {
    const token = await signJwt({ sub: "1" });
    const tampered = `${token.slice(0, -4)}XXXX`;
    expect(await verifyJwt(tampered)).toBeNull();
  });

  it("returns null for an already-expired token", async () => {
    const token = await signJwt({ sub: "1" }, -10);
    expect(await verifyJwt(token)).toBeNull();
  });

  it("returns null for an empty string", async () => {
    expect(await verifyJwt("")).toBeNull();
  });
});

describe("hashPassword", () => {
  it("returns a string that differs from the original password", async () => {
    const hash = await hashPassword("mypassword");
    expect(typeof hash).toBe("string");
    expect(hash).not.toBe("mypassword");
  });

  it("produces a different hash each time (due to salt)", async () => {
    const hash1 = await hashPassword("mypassword");
    const hash2 = await hashPassword("mypassword");
    expect(hash1).not.toBe(hash2);
  });
});

describe("verifyPassword", () => {
  it("returns true for the correct password", async () => {
    const hash = await hashPassword("correct-password");
    expect(await verifyPassword("correct-password", hash)).toBe(true);
  });

  it("returns false for a wrong password", async () => {
    const hash = await hashPassword("correct-password");
    expect(await verifyPassword("wrong-password", hash)).toBe(false);
  });

  it("returns false for an empty string against a real hash", async () => {
    const hash = await hashPassword("correct-password");
    expect(await verifyPassword("", hash)).toBe(false);
  });
});
