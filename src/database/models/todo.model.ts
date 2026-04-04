import { boolean, integer, pgTable, serial, text } from "drizzle-orm/pg-core";
import { users } from "./auth.model";

export const todos = pgTable("todos", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  completed: boolean("completed").default(false).notNull(),
  user_id: integer("user_id")
    .notNull()
    .references(() => users.id),
});
