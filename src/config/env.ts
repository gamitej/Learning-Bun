import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),
  PORT: z.coerce.number().default(3000),

  PROD_DATABASE_URL: z.string().optional(),

  LOCAL_DEV_DB_URL: z.string().optional(), // used in development when running locally
  LOCAL_TEST_DB_URL: z.string().optional(), // used when running tests locally (e.g. via `test:integration` script)
  VPS_TEST_DB_URL: z.string().optional(), // used in CI/CD pipeline (GitHub Actions) to point to a test DB on the VPS

  GITHUB_ACTIONS: z.string().optional(), // set to "true" in CI environment (GitHub Actions) by default

  JWT_SECRET: z.string().min(32),
  IDEMPOTENCY_EXPIRES_HOURS: z.coerce.number().default(24),

  LOG_LEVEL: z.enum(["info", "error", "warn", "debug"]).default("info"),
  LOKI_URL: z.string().url().optional(),
});

const result = envSchema.safeParse(process.env);

if (!result.success) {
  console.error("❌ Invalid environment variables:", result.error.format());
  process.exit(1);
}

export const env = result.data;
export type EnvType = z.infer<typeof envSchema>;
