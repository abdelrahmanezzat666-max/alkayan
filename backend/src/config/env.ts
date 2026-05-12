import path from "node:path";
import dotenv from "dotenv";
import { z } from "zod";

dotenv.config({ path: path.resolve(process.cwd(), ".env") });
dotenv.config({ path: path.resolve(process.cwd(), "../.env") });

const emptyAsUndefined = (value: unknown) => (value === "" ? undefined : value);

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().positive().default(4000),
  FIREBASE_PROJECT_ID: z.string().min(1),
  FIREBASE_SERVICE_ACCOUNT_PATH: z.preprocess(emptyAsUndefined, z.string().optional()),
  FIREBASE_CLIENT_EMAIL: z.preprocess(emptyAsUndefined, z.string().email().optional()),
  FIREBASE_PRIVATE_KEY: z.preprocess(emptyAsUndefined, z.string().optional()),
  JWT_SECRET: z.string().min(32, "JWT_SECRET must be at least 32 characters"),
  JWT_EXPIRES_IN: z.string().default("8h"),
  INVITATION_EXPIRES_HOURS: z.coerce.number().int().positive().default(48),
  APP_URL: z.string().url().default("http://localhost:5173"),
  API_URL: z.string().url().default("http://localhost:4000"),
  CORS_ORIGIN: z.string().default("http://localhost:5173"),
  SMTP_HOST: z.preprocess(emptyAsUndefined, z.string().optional()),
  SMTP_PORT: z.coerce.number().int().positive().default(587),
  SMTP_USER: z.preprocess(emptyAsUndefined, z.string().optional()),
  SMTP_PASS: z.preprocess(emptyAsUndefined, z.string().optional()),
  SMTP_FROM: z.string().default("Al Kayan <no-reply@alkayan.local>")
});

export const env = envSchema.parse(process.env);

export const corsOrigins = env.CORS_ORIGIN.split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);
