import { env } from "@/config/env";
import { logger } from "@/utils/logger";
import { type PostgresJsDatabase, drizzle } from "drizzle-orm/postgres-js";
import postgres, { type Sql } from "postgres";
import * as schema from "./schema";

let queryClient: Sql | null = null;
let database: PostgresJsDatabase<typeof schema> | null = null;

function createClient(): Sql {
  return postgres(env.DATABASE_URL, {
    max: 10,
    idle_timeout: 20,
    connect_timeout: 10,
    max_lifetime: 60 * 30,
  });
}

export function getDb(): PostgresJsDatabase<typeof schema> {
  if (!database) {
    throw new Error(
      "Database not initialized. Call startDatabase() before accessing db.",
    );
  }
  return database;
}

/**
 * Proxy that lazily delegates to getDb() — keeps existing `db` import working
 * everywhere without changing every file.
 */
export const db = new Proxy({} as PostgresJsDatabase<typeof schema>, {
  get(_target, prop, receiver) {
    return Reflect.get(getDb(), prop, receiver);
  },
});

const MAX_RETRIES = 5;
const RETRY_DELAY_MS = 2000;

async function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export const startDatabase = async (): Promise<void> => {
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      queryClient = createClient();
      database = drizzle(queryClient, { schema });

      await queryClient`SELECT 1`;
      logger.info("Database connection established");
      return;
    } catch (error) {
      logger.warn(
        { attempt, maxRetries: MAX_RETRIES, err: error },
        "Database connection attempt failed",
      );

      if (queryClient) {
        try {
          await queryClient.end();
        } catch {}
        queryClient = null;
        database = null;
      }

      if (attempt === MAX_RETRIES) {
        logger.error("All database connection attempts exhausted");
        throw error;
      }

      await sleep(RETRY_DELAY_MS * attempt);
    }
  }
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
    logger.info("Database connection closed");
  } catch (error) {
    logger.error({ err: error }, "Error closing database connection");
  }
};

export * from "./schema";
