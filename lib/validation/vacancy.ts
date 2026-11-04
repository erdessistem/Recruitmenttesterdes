import { z } from "zod";

import {
  EMPLOYMENT_TYPES,
  VACANCY_STATUSES,
} from "@/lib/constants";
import {
  isDateOnlyString,
  jakartaDateOnlyToUtc,
} from "@/lib/format/date";
import { MAX_POSITION_CODE_LENGTH } from "@/lib/format/applicant-id";
import { requiredText } from "@/lib/validation/fields";

export const slugSchema = z
  .string({ error: "Slug wajib diisi." })
  .trim()
  .min(1, { error: "Slug wajib diisi." })
  .max(120, { error: "Slug maksimal 120 karakter." })
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, {
    error: "Slug hanya boleh berisi huruf kecil, angka, dan tanda hubung.",
  });

export const positionCodeSchema = z
  .string({ error: "Kode posisi wajib diisi." })
  .trim()
  .min(1, { error: "Kode posisi wajib diisi." })
  .max(MAX_POSITION_CODE_LENGTH, { error: `Kode posisi maksimal ${MAX_POSITION_CODE_LENGTH} karakter.` })
  .regex(/^[A-Za-z0-9]+$/, { error: "Kode posisi hanya boleh berisi huruf dan angka." });

function optionalJakartaDateTime(edge: "start" | "end") {
  return z.preprocess(
    (value) => (value === null || value === undefined ? "" : value),
    z
      .string({ error: "Tanggal tidak valid." })
      .trim()
      .refine(
        (value) =>
          value === "" ||
          isDateOnlyString(value) ||
          (!/^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(value))),
        { error: "Tanggal tidak valid." },
      )
      .transform((value) => {
        if (value === "") return null;
        if (isDateOnlyString(value)) return jakartaDateOnlyToUtc(value, edge);
        return new Date(value).toISOString();
      }),
  );
}

export const vacancyFormSchema = z
  .object({
    title: requiredText("Judul lowongan", 3, 150),
    slug: slugSchema,
    position_code: positionCodeSchema,
    department: requiredText("Departemen", 2, 100),
    location: requiredText("Lokasi", 2, 100),
    employment_type: z.enum(EMPLOYMENT_TYPES, {
      error: "Pilih jenis pekerjaan.",
    }),
    description: requiredText("Deskripsi", 10, 10_000),
    requirements: requiredText("Persyaratan", 10, 10_000),
    quota: z.preprocess(
      (value) => (value === null || value === undefined || value === "" ? 0 : typeof value === "string" && value.trim() ? Number(value) : value),
      z
        .number({ error: "Kuota harus berupa angka bulat 0–10.000." })
        .int({ error: "Kuota harus berupa angka bulat." })
        .min(0, { error: "Kuota tidak boleh negatif." })
        .max(10_000, { error: "Kuota maksimal 10.000." }),
    ),
    open_at: optionalJakartaDateTime("start"),
    close_at: optionalJakartaDateTime("end"),
    status: z.enum(VACANCY_STATUSES, { error: "Pilih status lowongan." }).default("draft"),
  })
  .refine(
    (value) =>
      !value.open_at ||
      !value.close_at ||
      new Date(value.close_at).getTime() >= new Date(value.open_at).getTime(),
    {
      path: ["close_at"],
      error: "Tanggal tutup tidak boleh lebih awal dari tanggal buka.",
    },
  );

export type VacancyFormInput = z.input<typeof vacancyFormSchema>;
export type VacancyFormData = z.output<typeof vacancyFormSchema>;

export const vacancyFilterSchema = z.object({
  status: z.enum(VACANCY_STATUSES).optional(),
  department: z.string().trim().max(100).optional(),
  query: z.string().trim().max(150).optional(),
});
