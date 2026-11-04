import "server-only";

import { z } from "zod";

const trimOptional = (value: unknown) => {
  if (typeof value !== "string") return value;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
};

const keepOptional = (value: unknown) => {
  if (typeof value !== "string") return value;
  return value.trim().length > 0 ? value : undefined;
};

const envSchema = z
  .object({
    NODE_ENV: z
      .enum(["development", "test", "production"])
      .default("development"),
    NEXT_PUBLIC_APP_URL: z
      .string()
      .trim()
      .url({ error: "NEXT_PUBLIC_APP_URL harus berupa URL yang valid." })
      .default("http://localhost:3000"),
    AUTH_SECRET: z.preprocess(
      keepOptional,
      z
        .string()
        .min(32, { error: "AUTH_SECRET minimal 32 karakter." })
        .optional(),
    ),
    GOOGLE_SHEETS_ID: z.preprocess(
      trimOptional,
      z.string().min(1, { error: "GOOGLE_SHEETS_ID tidak boleh kosong." }).optional(),
    ),
    GOOGLE_SERVICE_ACCOUNT_EMAIL: z.preprocess(
      trimOptional,
      z.email({ error: "GOOGLE_SERVICE_ACCOUNT_EMAIL harus berupa email valid." }).optional(),
    ),
    GOOGLE_PRIVATE_KEY: z.preprocess(
      keepOptional,
      z.string().min(1, { error: "GOOGLE_PRIVATE_KEY tidak boleh kosong." }).optional(),
    ),
    ADMIN_EMAIL: z.preprocess(
      trimOptional,
      z.email({ error: "ADMIN_EMAIL harus berupa email valid." }).optional(),
    ),
    ADMIN_PASSWORD: z.preprocess(
      keepOptional,
      z
        .string()
        .min(8, { error: "ADMIN_PASSWORD minimal 8 karakter." })
        .optional(),
    ),
    UPSTASH_REDIS_REST_URL: z.preprocess(
      trimOptional,
      z.url({ error: "UPSTASH_REDIS_REST_URL harus berupa URL valid." }).optional(),
    ),
    UPSTASH_REDIS_REST_TOKEN: z.preprocess(
      trimOptional,
      z.string().min(1, { error: "Token Upstash tidak boleh kosong." }).optional(),
    ),
  })
  .superRefine((value, context) => {
    const googleValues = [
      value.GOOGLE_SHEETS_ID,
      value.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      value.GOOGLE_PRIVATE_KEY,
    ];
    const googleConfigured = googleValues.filter(Boolean).length;

    if (googleConfigured > 0 && googleConfigured < googleValues.length) {
      context.addIssue({
        code: "custom",
        path: ["GOOGLE_SHEETS_ID"],
        message:
          "Konfigurasi Google Sheets belum lengkap. Isi GOOGLE_SHEETS_ID, GOOGLE_SERVICE_ACCOUNT_EMAIL, dan GOOGLE_PRIVATE_KEY sekaligus.",
      });
    }

    const upstashValues = [
      value.UPSTASH_REDIS_REST_URL,
      value.UPSTASH_REDIS_REST_TOKEN,
    ];
    const upstashConfigured = upstashValues.filter(Boolean).length;

    if (upstashConfigured === 1) {
      context.addIssue({
        code: "custom",
        path: ["UPSTASH_REDIS_REST_URL"],
        message:
          "UPSTASH_REDIS_REST_URL dan UPSTASH_REDIS_REST_TOKEN harus diisi bersama atau dikosongkan bersama.",
      });
    }
  });

export type Env = z.infer<typeof envSchema>;

export function parseEnv(source: Record<string, string | undefined>): Env {
  const result = envSchema.safeParse(source);

  if (!result.success) {
    const details = result.error.issues
      .map((issue) => `${issue.path.join(".") || "env"}: ${issue.message}`)
      .join("\n");

    throw new Error(`Konfigurasi environment tidak valid:\n${details}`);
  }

  return result.data;
}

export const env = parseEnv(process.env);

export function hasGoogleSheetsConfig(): boolean {
  return Boolean(
    env.GOOGLE_SHEETS_ID &&
      env.GOOGLE_SERVICE_ACCOUNT_EMAIL &&
      env.GOOGLE_PRIVATE_KEY,
  );
}

export function getGoogleCredentials(): {
  clientEmail: string;
  privateKey: string;
} {
  if (
    !env.GOOGLE_SERVICE_ACCOUNT_EMAIL ||
    !env.GOOGLE_PRIVATE_KEY ||
    !env.GOOGLE_SHEETS_ID
  ) {
    throw new Error(
      "Konfigurasi Google Sheets belum lengkap. Periksa GOOGLE_SHEETS_ID, GOOGLE_SERVICE_ACCOUNT_EMAIL, dan GOOGLE_PRIVATE_KEY.",
    );
  }

  const privateKey = env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, "\n");

  if (!privateKey.includes("BEGIN PRIVATE KEY")) {
    throw new Error(
      "GOOGLE_PRIVATE_KEY tidak valid. Gunakan isi private key lengkap dengan newline yang di-escape.",
    );
  }

  return {
    clientEmail: env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
    privateKey,
  };
}

export function getSpreadsheetId(): string {
  if (!env.GOOGLE_SHEETS_ID) {
    throw new Error("GOOGLE_SHEETS_ID belum diatur.");
  }

  return env.GOOGLE_SHEETS_ID;
}

/**
 * Auth is introduced in Batch 4. Development has a deterministic fallback so
 * the app and tests run without credentials; production requires a real secret.
 */
export function getAuthSecret(): string {
  if (env.AUTH_SECRET) return env.AUTH_SECRET;

  if (env.NODE_ENV === "production") {
    throw new Error("AUTH_SECRET wajib diatur di production (minimal 32 karakter).");
  }

  return "development-only-insecure-auth-secret-change-before-production";
}

export function getRateLimitConfig(): {
  url: string;
  token: string;
} | null {
  if (!env.UPSTASH_REDIS_REST_URL || !env.UPSTASH_REDIS_REST_TOKEN) {
    return null;
  }

  return {
    url: env.UPSTASH_REDIS_REST_URL,
    token: env.UPSTASH_REDIS_REST_TOKEN,
  };
}
