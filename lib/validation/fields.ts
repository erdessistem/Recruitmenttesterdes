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
