import { applicationFormSchema } from "@/lib/validation/application";

/** The four steps of the application form, in order. Field names match the form inputs. */
export const APPLICATION_STEPS = [
  { title: "Data diri", short: "Data diri", fields: ["full_name", "whatsapp", "email", "city"] },
  {
    title: "Pendidikan dan pengalaman",
    short: "Pengalaman",
    fields: [
      "last_education",
      "major",
      "experience_years",
      "last_company",
      "last_position",
      "last_salary",
      "expected_salary",
    ],
  },
  {
    title: "Lamaran",
    short: "Lamaran",
    fields: ["cv_url", "linkedin_url", "motivation", "availability", "source", "source_other"],
  },
  { title: "Tinjau dan kirim", short: "Tinjau", fields: ["consent"] },
] as const;

export type FieldErrors = Record<string, string[]>;

/** Fields kept in the session draft. Consent and the honeypot are never stored. */
export const DRAFT_FIELDS: readonly string[] = APPLICATION_STEPS.slice(0, 3).flatMap(
  (step) => step.fields,
);

/** Validates the whole form but returns only the errors that belong to the given fields. */
export function errorsFor(data: Record<string, unknown>, fields: readonly string[]): FieldErrors {
  const parsed = applicationFormSchema.safeParse(data);
  if (parsed.success) return {};
  const all = parsed.error.flatten().fieldErrors as FieldErrors;
  return Object.fromEntries(Object.entries(all).filter(([name]) => fields.includes(name)));
}

/** Errors for one step, so a candidate cannot move on with that step incomplete. */
export function stepErrors(data: Record<string, unknown>, step: number): FieldErrors {
  return errorsFor(data, APPLICATION_STEPS[step]?.fields ?? []);
}

/** The first step that contains any of the given errors, or null when there are none. */
export function firstStepWithError(errors: FieldErrors): number | null {
  const names = Object.keys(errors);
  // Screening question answers live in the Lamaran step.
  if (names.some((name) => name.startsWith("q_"))) {
    const own = APPLICATION_STEPS.findIndex((step) =>
      step.fields.some((field) => names.includes(field)),
    );
    return own >= 0 && own < 2 ? own : 2;
  }
  const index = APPLICATION_STEPS.findIndex((step) =>
    step.fields.some((field) => names.includes(field)),
  );
  return index >= 0 ? index : null;
}
