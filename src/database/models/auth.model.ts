import { hashPassword, verifyPassword } from "@/utils/auth";
import { eq } from "drizzle-orm";
import { pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password_hash: text("password_hash").notNull(),
  created_at: timestamp("created_at").defaultNow().notNull(),
});

type DbInstance = PostgresJsDatabase<Record<string, unknown>>;

export const UserHelpers = {
  create: async (
    db: DbInstance,
    data: { username: string; passwordRaw: string },
  ) => {
    const password_hash = await hashPassword(data.passwordRaw);

    const [user] = await db
      .insert(users)
      .values({
        username: data.username,
        password_hash,
      })
      .returning();

    return user;
  },

  verify: async (db: DbInstance, username: string, passwordRaw: string) => {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.username, username))
      .limit(1);

    if (!user) return null;

    const isValid = await verifyPassword(passwordRaw, user.password_hash);
    return isValid ? user : null;
  },
};
