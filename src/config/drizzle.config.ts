import { defineConfig } from "drizzle-kit";
import { env } from "./env";

const isProd = env.NODE_ENV === "production";
const isCI = env.GITHUB_ACTIONS === "true";
const isTest = env.NODE_ENV === "test";

let dbUrl = "";
if (isProd) {
  dbUrl = env.PROD_DATABASE_URL ?? "";
} else if (isCI) {
  dbUrl = env.VPS_TEST_DB_URL ?? "";
} else if (isTest) {
  dbUrl = env.LOCAL_TEST_DB_URL ?? "";
} else {
  dbUrl = env.LOCAL_DEV_DB_URL ?? "";
}

export default defineConfig({
  out: "./drizzle",
  schema: "./src/database/schema.ts",
  dialect: "postgresql",
  dbCredentials: {
    url: dbUrl,
  },
  verbose: true,
  strict: true,
});
