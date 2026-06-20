import { z } from "zod";

export const envSchema = z.object({
  DATABASE_URL: z.string().min(1),
  NEXTAUTH_SECRET: z.string().min(1),
  NEXTAUTH_URL: z.string().url(),
  APP_URL: z.string().url(),
  BUSINESS_NAME: z.string().default("Bandhan"),
  BUSINESS_EMAIL: z.string().email().optional(),
  BUSINESS_PHONE: z.string().optional()
});

export function validateEnv() {
  return envSchema.safeParse(process.env);
}
