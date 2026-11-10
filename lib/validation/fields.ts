import { z } from "zod";

import { normalizeWhatsApp } from "@/lib/format/phone";

const emailSchema = z.email();

export const whatsappField = z
  .string({ error: "No. WhatsApp wajib diisi." })
  .trim()
  .superRefine((value, context) => {
    if (!normalizeWhatsApp(value)) {
      context.addIssue({
        code: "custom",
        message: "Masukkan nomor WhatsApp Indonesia yang valid, misalnya 0812 3456 7890.",
      });
    }
  })
  .transform((value) => normalizeWhatsApp(value) as string);

export function requiredText(label: string, min: number, max: number) {
  return z
    .string({ error: `${label} wajib diisi.` })
    .trim()
    .min(min, { error: `${label} minimal ${min} karakter.` })
    .max(max, { error: `${label} maksimal ${max} karakter.` });
}

export function optionalText(label: string, max: number) {
  return z.preprocess(
    (value) => (value === null || value === undefined ? "" : value),
    z
      .string({ error: `${label} tidak valid.` })
      .trim()
      .max(max, { error: `${label} maksimal ${max} karakter.` }),
  );
}

/** Optional choice from a fixed list; an empty answer is stored as "". */
export function optionalChoice<const T extends readonly [string, ...string[]]>(
  values: T,
  label: string,
) {
  return z.preprocess(
    (value) => (value === null || value === undefined ? "" : value),
    z.union([z.literal(""), z.enum(values)], { error: `${label} tidak valid.` }),
  );
}

/** Optional date as YYYY-MM-DD that is a real calendar date and not in the future. */
export function optionalDateField(label: string) {
  return z.preprocess(
    (value) => (value === null || value === undefined ? "" : value),
    z
      .string({ error: `${label} tidak valid.` })
      .trim()
      .refine(
        (value) => {
          if (value === "") return true;
          if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
          const time = Date.parse(`${value}T00:00:00Z`);
          if (!Number.isFinite(time)) return false;
          if (new Date(time).toISOString().slice(0, 10) !== value) return false;
          return value <= new Date().toISOString().slice(0, 10);
        },
        { error: `${label} tidak valid.` },
      ),
  );
}

export function optionalEmailField(label: string, max = 150) {
  return z.preprocess(
    (value) => (value === null || value === undefined ? "" : value),
    z
      .string({ error: `${label} tidak valid.` })
      .trim()
      .max(max, { error: `${label} maksimal ${max} karakter.` })
      .refine((value) => value === "" || emailSchema.safeParse(value).success, {
        error: `Format ${label.toLowerCase()} tidak valid.`,
      }),
  );
}

export function optionalHttpsUrl(label: string, max: number) {
  return z.preprocess(
    (value) => (value === null || value === undefined ? "" : value),
    z
      .string({ error: `${label} tidak valid.` })
      .trim()
      .max(max, { error: `${label} maksimal ${max} karakter.` })
      .refine(
        (value) =>
          value === "" || (value.startsWith("https://") && z.url().safeParse(value).success),
        { error: `${label} harus berupa URL valid yang diawali https://.` },
      ),
  );
}

export function integerField(options: {
  label: string;
  min: number;
  max: number;
  minMessage?: string;
  maxMessage?: string;
}) {
  return z.preprocess(
    (value) => {
      if (value === null || value === undefined || value === "") return undefined;
      if (typeof value === "string") {
        const parsed = Number(value.trim());
        return Number.isFinite(parsed) ? parsed : value;
      }
      return value;
    },
    z
      .number({
        error: `${options.label} wajib diisi dengan angka bulat.`,
      })
      .int({ error: `${options.label} harus berupa angka bulat.` })
      .min(options.min, {
        error: options.minMessage ?? `${options.label} minimal ${options.min}.`,
      })
      .max(options.max, {
        error: options.maxMessage ?? `${options.label} maksimal ${options.max}.`,
      }),
  );
}

/** Any Indonesian phone number (mobile or landline), stored normalized like WhatsApp numbers. */
export function phoneField(label: string) {
  return z
    .string({ error: `${label} wajib diisi.` })
    .trim()
    .superRefine((value, context) => {
      if (!normalizeWhatsApp(value)) {
        context.addIssue({
          code: "custom",
          message: `${label} tidak valid. Contoh: 0812 3456 7890.`,
        });
      }
    })
    .transform((value) => normalizeWhatsApp(value) as string);
}
