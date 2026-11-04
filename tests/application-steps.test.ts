import { describe, expect, it } from "vitest";
import {
  APPLICATION_STEPS,
  DRAFT_FIELDS,
  firstStepWithError,
  stepErrors,
} from "@/lib/public/application-steps";
import { applicationFormSchema } from "@/lib/validation/application";

const valid = {
  full_name: "Siti Aminah",
  whatsapp: "0812 3456 7890",
  email: "",
  city: "Depok",
  last_education: "s1",
  major: "",
  experience_years: "2",
  last_company: "",
  last_salary: "0",
  expected_salary: "5.000.000",
  cv_url: "",
  linkedin_url: "",
  motivation: "Saya ingin mengajar dan berkembang bersama tim Erdes Group.",
  availability: "immediately",
  source: "instagram",
  source_other: "",
  consent: true,
  form_started_at: 0,
};

describe("application steps", () => {
  it("covers every form field exactly once", () => {
    const stepFields = APPLICATION_STEPS.flatMap((step) => step.fields).sort();
    const schemaFields = Object.keys(applicationFormSchema.shape)
      .filter((name) => name !== "website" && name !== "form_started_at")
      .sort();
    expect(stepFields).toEqual(schemaFields);
  });

  it("reports only the current step's errors", () => {
    const data = { ...valid, full_name: "", motivation: "" };
    expect(Object.keys(stepErrors(data, 0))).toEqual(["full_name"]);
    expect(Object.keys(stepErrors(data, 1))).toEqual([]);
    expect(Object.keys(stepErrors(data, 2))).toEqual(["motivation"]);
  });

  it("requires source_other only when the source is Lainnya", () => {
    expect(stepErrors({ ...valid, source: "other", source_other: "" }, 2)).toHaveProperty(
      "source_other",
    );
  });

  it("finds the first step with a server error", () => {
    expect(firstStepWithError({ motivation: ["x"], whatsapp: ["y"] })).toBe(0);
    expect(firstStepWithError({ consent: ["x"] })).toBe(3);
    expect(firstStepWithError({})).toBeNull();
  });

  it("never stores consent or the honeypot in the draft", () => {
    expect(DRAFT_FIELDS).not.toContain("consent");
    expect(DRAFT_FIELDS).not.toContain("website");
  });
});
