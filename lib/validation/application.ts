import { z } from "zod";

import {
  APPLICATION_SOURCES,
  AVAILABILITIES,
  EDUCATION_LEVELS,
  MIN_FORM_FILL_SECONDS,
  SOURCE_OTHER,
} from "@/lib/constants";
import { parseRupiahInput } from "@/lib/format/currency";
import {
  integerField,
  optionalEmailField,
  optionalHttpsUrl,
  optionalText,
  phoneField,
  requiredText,
  whatsappField,
} from "@/lib/validation/fields";

function salaryField(options: { label: string; min: number; minMessage: string }) {
  return z.preprocess(
    (value) => {
      if (value === null || value === undefined || value === "") return undefined;
      if (typeof value === "number") return value;
      return parseRupiahInput(value);
    },
    z
      .number({
        error: `${options.label} wajib diisi dengan angka rupiah yang valid.`,
      })
      .int({ error: `${options.label} harus berupa angka bulat.` })
      .min(options.min, { error: options.minMessage })
      .max(1_000_000_000, {
        error: `${options.label} maksimal Rp1.000.000.000.`,
      }),
  );
}

export const applicationFormSchema = z
  .object({
    full_name: requiredText("Nama lengkap", 2, 100),
    whatsapp: whatsappField,
    email: optionalEmailField("Email", 150),
    city: requiredText("Alamat domisili", 5, 250),
    last_education: z.enum(EDUCATION_LEVELS, {
      error: "Pilih pendidikan terakhir.",
    }),
    major: optionalText("Jurusan", 100),
    experience_years: integerField({
      label: "Pengalaman kerja",
      min: 0,
      max: 60,
      minMessage: "Pengalaman kerja tidak boleh negatif.",
      maxMessage: "Pengalaman kerja maksimal 60 tahun.",
    }),
    last_company: optionalText("Perusahaan terakhir", 150),
    last_position: optionalText("Posisi terakhir", 100),
    reference_name: requiredText("Nama referensi", 2, 100),
    reference_phone: phoneField("Nomor referensi"),
    emergency_name: requiredText("Nama kontak darurat", 2, 100),
    emergency_relation: requiredText("Hubungan", 2, 50),
    emergency_phone: phoneField("Nomor darurat"),
    last_salary: salaryField({
      label: "Gaji terakhir",
      min: 0,
      minMessage: "Gaji terakhir tidak boleh negatif. Isi 0 jika belum pernah bekerja.",
    }),
    expected_salary: salaryField({
      label: "Ekspektasi gaji",
      min: 1,
      minMessage: "Ekspektasi gaji harus lebih dari 0.",
    }),
    cv_url: optionalHttpsUrl("Link CV/portfolio", 500),
    linkedin_url: optionalHttpsUrl("LinkedIn", 300),
    motivation: requiredText("Motivasi melamar", 20, 1_000),
    availability: z.enum(AVAILABILITIES, {
      error: "Pilih ketersediaan mulai kerja.",
    }),
    source: z.enum(APPLICATION_SOURCES, {
      error: "Pilih sumber informasi.",
    }),
    source_other: optionalText("Sumber informasi lainnya", 100),
    consent: z
      .boolean({ error: "Persetujuan data wajib dicentang." })
      .refine((value) => value === true, {
        error: "Persetujuan data wajib dicentang.",
      }),
    website: z
      .string({ error: "Kolom ini harus kosong." })
      .max(0, { error: "Kolom ini harus kosong." })
      .optional(),
    form_started_at: z.union([z.number(), z.string()]).optional(),
  })
  .superRefine((value, context) => {
    // These numbers are for reaching someone else, so they cannot be the applicant's own.
    for (const name of ["emergency_phone", "reference_phone"] as const) {
      if (value[name] === value.whatsapp) {
        context.addIssue({
          code: "custom",
          path: [name],
          message: "Nomor ini harus berbeda dari nomor WhatsApp Anda.",
        });
      }
    }
    if (value.source === SOURCE_OTHER && value.source_other.length === 0) {
      context.addIssue({
        code: "custom",
        path: ["source_other"],
        message: "Sumber informasi lainnya wajib diisi.",
      });
    }
  });

export type ApplicationFormInput = z.input<typeof applicationFormSchema>;
export type ApplicationFormData = z.output<typeof applicationFormSchema>;

/** True when the honeypot field contains a value. */
export function isHoneypotFilled(value: unknown): boolean {
  return typeof value === "string" && value.trim().length > 0;
}

/**
 * Rejects submissions completed faster than three seconds.
 * Missing or malformed timestamps are treated as suspicious.
 */
export function isFormTooFast(
  startedAt: unknown,
  now: number = Date.now(),
  minimumSeconds: number = MIN_FORM_FILL_SECONDS,
): boolean {
  let timestamp: number | null = null;

  if (typeof startedAt === "number") {
    timestamp = startedAt;
  } else if (typeof startedAt === "string" && startedAt.trim().length > 0) {
    const asNumber = Number(startedAt);
    timestamp = Number.isFinite(asNumber) ? asNumber : Date.parse(startedAt);
  }

  if (timestamp === null || !Number.isFinite(timestamp)) return true;

  const elapsedMs = now - timestamp;
  return elapsedMs < minimumSeconds * 1_000;
}
