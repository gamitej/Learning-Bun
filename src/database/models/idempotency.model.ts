import { jsonb, pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";

export const idempotency = pgTable("idempotency", {
  id: serial("id").primaryKey(),
  idempotencyKey: text("idempotency_key").notNull().unique(),
  response: jsonb("response"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  expiresAt: timestamp("expires_at"),
});
