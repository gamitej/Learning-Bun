import { env } from "@/config/env";
import { logger } from "@/utils/logger";
import { type PostgresJsDatabase, drizzle } from "drizzle-orm/postgres-js";
import postgres, { type Sql } from "postgres";
import * as schema from "./schema";

const isProd = env.NODE_ENV === "production";
const isTest = env.NODE_ENV === "test";
const isCI = env.GITHUB_ACTIONS === "true";

function resolveConnectionString(): string {
  if (isProd) return env.PROD_DATABASE_URL ?? ""; // in production, we expect the connection string
  if (isCI) return env.VPS_TEST_DB_URL ?? ""; // in CI/CD pipeline, use the VPS test database
  if (isTest) return env.LOCAL_TEST_DB_URL ?? ""; // when running tests locally, use the local test database
  return env.LOCAL_DEV_DB_URL ?? ""; // in development, use the local development database
}

const envLabel = isProd ? "PROD" : isCI ? "CI" : isTest ? "TEST" : "DEV";

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

export const db = new Proxy({} as PostgresJsDatabase<typeof schema>, {
  get(_target, prop, receiver) {
    return Reflect.get(getDb(), prop, receiver);
  },
});

export const startDatabase = async (): Promise<void> => {
  const connectionString = resolveConnectionString();

  if (!connectionString && connectionString !== "") {
    logger.error(
      `No database connection string provided for environment [${envLabel}]`,
    );
    throw new Error(
      `Database connection string is required for environment [${envLabel}]`,
    );
  }

  let queryClient = null;

  if (isProd) {
    queryClient = postgres(connectionString, {
      max: 50,
      idle_timeout: 30,
      connect_timeout: 10,
      ssl: "require",
    });
  }

  queryClient = postgres(connectionString, {
    max: 5,
    idle_timeout: 5,
    connect_timeout: 10,
    ssl: false,
  });

  database = drizzle(queryClient, { schema });

  await queryClient`SELECT 1`;
  logger.info(`Database connected [${envLabel}]`);
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
