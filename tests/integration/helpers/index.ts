import { getDb } from "@/database";
import { UserHelpers, todos, users } from "@/database/schema";
import { signJwt } from "@/utils/auth";

export async function setupTestContext(username: string) {
  await getDb().delete(users);

  const user = await UserHelpers.create(getDb(), {
    username,
    passwordRaw: "test-password",
  });

  if (!user) {
    throw new Error("Failed to create test user");
  }

  const token = await signJwt({
    sub: user.id.toString(),
    username: user.username,
  });

  return {
    user,
    token,
    authHeader: `Bearer ${token}`,
    authed: (method: string, body?: unknown) => ({
      method,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      ...(body ? { body: JSON.stringify(body) } : {}),
    }),
  };
}

// ── Generic HTTP helpers ───────────────────────────────────────────────────

/** Parse a response as a plain JSON object. */
export async function json(res: Response) {
  return res.json() as Promise<Record<string, any>>;
}

/** Build an unsigned fetch-init object with a JSON body. */
export function jsonReq(method: string, body?: unknown) {
  return {
    method,
    headers: { "Content-Type": "application/json" },
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
  };
}

// ── Todo seed helper ───────────────────────────────────────────────────────

/** Insert a single todo and return it; throws if the insert fails. */
export async function createTestTodo(
  userId: number,
  overrides: Partial<{ title: string; completed: boolean }> = {},
) {
  const [todo] = await getDb()
    .insert(todos)
    .values({
      title: "Test todo",
      completed: false,
      user_id: userId,
      ...overrides,
    })
    .returning();

  if (!todo) {
    throw new Error("Failed to create test todo");
  }

  return todo;
}
