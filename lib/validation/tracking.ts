import { z } from "zod";

import { requiredText, whatsappField } from "@/lib/validation/fields";

export const applicantIdField = z
  .string({ error: "Applicant ID wajib diisi." })
  .trim()
  .min(1, { error: "Applicant ID wajib diisi." })
  .max(100, { error: "Applicant ID terlalu panjang." });

/** Read-only tracking needs only the Applicant ID (DECISIONS.md §20 #14). */
export const trackingLookupSchema = z.object({
  applicant_id: applicantIdField,
});

export type TrackingLookupData = z.output<typeof trackingLookupSchema>;

export const lostIdRecoverySchema = z.object({
  whatsapp: whatsappField,
  full_name: requiredText("Nama lengkap", 2, 100),
});

export type LostIdRecoveryData = z.output<typeof lostIdRecoverySchema>;

export const withdrawalSchema = z.object({
  applicant_id: applicantIdField,
  whatsapp: whatsappField,
});

export type WithdrawalData = z.output<typeof withdrawalSchema>;
