import { env } from "@/config/env";
import { logger } from "@/utils/logger";
import { type PostgresJsDatabase, drizzle } from "drizzle-orm/postgres-js";
import postgres, { type Sql } from "postgres";
import * as schema from "./schema";

const isProd = env.NODE_ENV === "production";

let queryClient: Sql | null = null;
let database: PostgresJsDatabase<typeof schema> | null = null;

export function getDb(): PostgresJsDatabase<typeof schema> {
  if (!database) {
    throw new Error(
      "Database not initialized. Call startDatabase() before accessing db.",
    );
  }
  return database;
}

export let db: PostgresJsDatabase<typeof schema> =
  null as unknown as PostgresJsDatabase<typeof schema>;

export const startDatabase = async (): Promise<void> => {
  queryClient = isProd
    ? postgres(env.DATABASE_URL, {
        max: 50,
        idle_timeout: 30,
        connect_timeout: 10,
        ssl: "require",
      })
    : postgres(env.DATABASE_URL, {
        max: 5,
        idle_timeout: 5,
        connect_timeout: 10,
        ssl: false,
      });

  database = drizzle(queryClient, { schema });
  db = database;

  await queryClient`SELECT 1`;
  logger.info(`Database connected [${env.NODE_ENV.toUpperCase()}]`);
};

export const stopDatabase = async (): Promise<void> => {
  if (!queryClient) {
    logger.warn("stopDatabase called but no active connection");
    return;
  }
  try {
    await queryClient.end();
    queryClient = null;
    database = null;
    db = null as unknown as PostgresJsDatabase<typeof schema>;
    logger.info("Database connection closed");
  } catch (error) {
    logger.error({ err: error }, "Error closing database connection");
  }
};

export * from "./schema";
