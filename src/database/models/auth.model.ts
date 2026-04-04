import { hashPassword, verifyPassword } from "@/utils/auth";
import { eq } from "drizzle-orm";
import { pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password_hash: text("password_hash").notNull(),
  created_at: timestamp("created_at").defaultNow().notNull(),
});

export const UserHelpers = {
  /**
   * Creates a new user with a hashed password
   */
  create: async (db: any, data: { username: string; passwordRaw: string }) => {
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

  /**
   * Finds a user and validates their password
   */
  verify: async (db: any, username: string, passwordRaw: string) => {
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
