import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),
  PORT: z.coerce.number().default(3000),

  DATABASE_URL: z.string().url(),

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
