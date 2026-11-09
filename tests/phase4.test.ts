import { describe, expect, it } from "vitest";
import { MemoryRepository } from "@/lib/repositories/memory";
import { createSeedData } from "@/lib/repositories/seed";
import { submitApplication } from "@/lib/public/submit-application";
import {
  collectAnswers,
  hasMismatch,
  isMismatch,
  screeningErrors,
  screeningQuestionsSchema,
  toPublicQuestions,
} from "@/lib/public/screening";
import { compareToRange, formatSalaryRange } from "@/lib/format/currency";
import { hasRole } from "@/lib/auth/roles";
import { buildReport } from "@/lib/admin/reports";
import { vacancyFormSchema } from "@/lib/validation/vacancy";
import { applicantsCsv } from "@/lib/admin/csv";

const now = new Date("2026-11-03T00:00:00Z");
function setup() {
  const seed = createSeedData(now);
  return { seed, repo: new MemoryRepository({ seed, now: () => now }) };
}
const form = {
  full_name: "Ani Putri",
  whatsapp: "081234567899",
  city: "Jl. Melati No. 5, Depok",
  reference_name: "Hendra Wijaya",
  reference_phone: "081300000999",
  emergency_name: "Sri Rahayu",
  emergency_relation: "Ibu",
  emergency_phone: "081900000999",
  last_education: "s1",
  experience_years: "2",
  last_salary: "0",
  expected_salary: "5.000.000",
  motivation: "Saya ingin bergabung dan berkembang bersama perusahaan.",
  availability: "immediately",
  source: "website",
  consent: true,
  form_started_at: now.getTime() - 5000,
};

describe("screening questions", () => {
  const questions = [
    {
      id: "a",
      text: "Bersedia di Depok?",
      type: "yes_no" as const,
      required: true,
      expected: "yes" as const,
    },
    { id: "b", text: "Kurikulum?", type: "text" as const, required: false, expected: null },
  ];
  it("requires required answers and accepts only Ya/Tidak for yes/no", () => {
    expect(screeningErrors(questions, {})).toHaveProperty("q_a");
    expect(screeningErrors(questions, { q_a: "maybe" })).toHaveProperty("q_a");
    expect(screeningErrors(questions, { q_a: "no" })).toEqual({});
  });
  it("flags answers that differ from the expected one", () => {
    const answers = collectAnswers(questions, { q_a: "no", q_b: "Merdeka" });
    expect(isMismatch(answers[0])).toBe(true);
    expect(isMismatch(answers[1])).toBe(false);
    expect(hasMismatch(collectAnswers(questions, { q_a: "yes" }))).toBe(false);
  });
  it("never sends the expected answer to candidates", () => {
    expect(JSON.stringify(toPublicQuestions(questions))).not.toContain("expected");
  });
  it("drops expected answers on text questions and limits the count", () => {
    const parsed = screeningQuestionsSchema.parse([
      { id: "x", text: "Tulis jawaban", type: "text", required: true, expected: "yes" },
    ]);
    expect(parsed[0].expected).toBeNull();
    const six = Array.from({ length: 6 }, (_, i) => ({
      id: `q${i}`,
      text: "Pertanyaan",
      type: "text",
      required: false,
      expected: null,
    }));
    expect(screeningQuestionsSchema.safeParse(six).success).toBe(false);
  });
  it("stores answers with the application and rejects missing required ones", async () => {
    const { repo } = setup();
    const missing = await submitApplication(
      repo,
      "guru-matematika",
      form,
      crypto.randomUUID(),
      now,
    );
    expect(missing.ok).toBe(false);
    if (!missing.ok) expect(missing.errors).toHaveProperty("q_penempatan");
    const ok = await submitApplication(
      repo,
      "guru-matematika",
      { ...form, q_penempatan: "no" },
      crypto.randomUUID(),
      now,
    );
    expect(ok.ok).toBe(true);
    if (!ok.ok) return;
    const saved = await repo.getApplicationByToken(ok.token);
    expect(saved?.screeningAnswers[0]).toMatchObject({
      question: "Bersedia ditempatkan di Depok?",
      answer: "no",
      expected: "yes",
    });
    expect(applicantsCsv([saved!], [])).toContain("Bersedia ditempatkan di Depok?: Tidak");
  });
});

describe("salary range", () => {
  it("formats ranges and compares expectations", () => {
    expect(formatSalaryRange(4_500_000, 6_000_000)).toBe("Rp4.500.000 – Rp6.000.000");
    expect(formatSalaryRange(4_500_000, null)).toBe("Mulai Rp4.500.000");
    expect(formatSalaryRange(null, null)).toBeNull();
    expect(compareToRange(7_000_000, 4_500_000, 6_000_000)).toBe("above");
    expect(compareToRange(5_000_000, 4_500_000, 6_000_000)).toBe("within");
    expect(compareToRange(5_000_000, null, null)).toBeNull();
  });
  it("validates the vacancy form salary fields", () => {
    const base = {
      title: "Admin Kantor",
      slug: "admin-kantor",
      position_code: "Admin",
      department: "Operasional",
      location: "Depok",
      employment_type: "full_time",
      description: "Deskripsi posisi ini",
      requirements: "Persyaratan posisi ini",
      status: "draft",
    };
    const ok = vacancyFormSchema.safeParse({
      ...base,
      salary_min: "4.500.000",
      salary_max: "6.000.000",
      salary_visible: "on",
    });
    expect(ok.success && ok.data.salary_min).toBe(4_500_000);
    expect(
      vacancyFormSchema.safeParse({ ...base, salary_min: "6.000.000", salary_max: "4.000.000" })
        .success,
    ).toBe(false);
    expect(vacancyFormSchema.safeParse({ ...base, salary_visible: "on" }).success).toBe(false);
  });
});

describe("admin accounts and roles", () => {
  it("ranks roles", () => {
    expect(hasRole("superadmin", "hr")).toBe(true);
    expect(hasRole("hr", "hr")).toBe(true);
    expect(hasRole("viewer", "hr")).toBe(false);
  });
  it("adds accounts, rejects duplicate emails and signs changed accounts out", async () => {
    const { repo } = setup();
    const hr = await repo.addAdmin({
      email: "HR@Example.com",
      name: "HR",
      passwordHash: "x",
      role: "hr",
    });
    expect(hr.email).toBe("hr@example.com");
    await expect(
      repo.addAdmin({ email: "hr@example.com", name: "Lagi", passwordHash: "x" }),
    ).rejects.toThrow();
    const updated = await repo.updateAdmin(hr.id, { role: "viewer" });
    expect(updated.role).toBe("viewer");
    expect(updated.sessionVersion).toBe(hr.sessionVersion + 1);
  });
  it("keeps at least one active superadmin", async () => {
    const { repo, seed } = setup();
    const only = seed.adminUsers[0];
    await expect(repo.updateAdmin(only.id, { active: false })).rejects.toThrow();
    await expect(repo.updateAdmin(only.id, { role: "hr" })).rejects.toThrow();
    await repo.addAdmin({
      email: "second@example.com",
      name: "Dua",
      passwordHash: "x",
      role: "superadmin",
    });
    expect((await repo.updateAdmin(only.id, { role: "hr" })).role).toBe("hr");
  });
});

describe("reports", () => {
  it("counts sources, the furthest stage reached and time per stage", async () => {
    const { repo } = setup();
    const report = buildReport(await repo.getReportData(), { period: "semua" }, now);
    expect(report.totals.total).toBe(5);
    expect(report.funnel[0].count).toBe(5);
    expect(report.funnel.every((row, i, all) => i === 0 || row.count <= all[i - 1].count)).toBe(
      true,
    );
    expect(report.sources.reduce((sum, row) => sum + row.count, 0)).toBe(5);
    expect(report.durations.find((row) => row.stage === "applied")?.samples).toBeGreaterThan(0);
  });
  it("filters by period and vacancy", async () => {
    const { repo, seed } = setup();
    const data = await repo.getReportData();
    expect(buildReport(data, { period: "30" }, now).totals.total).toBeLessThan(5);
    const one = buildReport(data, { period: "semua", vacancyId: seed.vacancies[1].id }, now);
    expect(one.totals.total).toBe(2);
  });
});

describe("reference and emergency contacts", () => {
  it("requires both, normalizes the numbers and keeps them on the application", async () => {
    const { repo } = setup();
    const withoutReference: Record<string, unknown> = { ...form };
    delete withoutReference.reference_name;
    const missing = await submitApplication(
      repo,
      "admin",
      withoutReference,
      crypto.randomUUID(),
      now,
    );
    expect(missing.ok).toBe(false);
    if (!missing.ok) expect(missing.errors).toHaveProperty("reference_name");
    const ok = await submitApplication(repo, "admin", form, crypto.randomUUID(), now);
    expect(ok.ok).toBe(true);
    if (!ok.ok) return;
    const saved = await repo.getApplicationByToken(ok.token);
    expect(saved).toMatchObject({
      referenceName: "Hendra Wijaya",
      referencePhone: "6281300000999",
      emergencyRelation: "Ibu",
      emergencyPhone: "6281900000999",
    });
    expect(applicantsCsv([saved!], [])).toContain("Sri Rahayu");
  });
  it("rejects the applicant's own number as a contact", async () => {
    const { repo } = setup();
    const result = await submitApplication(
      repo,
      "admin",
      { ...form, emergency_phone: form.whatsapp },
      crypto.randomUUID(),
      now,
    );
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.errors).toHaveProperty("emergency_phone");
  });
});
