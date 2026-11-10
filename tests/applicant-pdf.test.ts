import { describe, expect, it } from "vitest";
import { MemoryRepository } from "@/lib/repositories/memory";
import { createSeedData } from "@/lib/repositories/seed";
import { applicantPdfModel, pdfFileName, pdfSafeText } from "@/lib/admin/applicant-pdf-model";
import { renderApplicantPdf } from "@/lib/admin/applicant-pdf";

const now = new Date("2026-11-03T00:00:00Z");

async function workspace() {
  const seed = createSeedData(now);
  const repo = new MemoryRepository({ seed, now: () => now });
  const withNote = seed.notes[0]?.applicationId ?? seed.applications[0].id;
  const data = await repo.getApplicantWorkspace(withNote);
  if (!data) throw new Error("seed application missing");
  return data;
}

describe("applicant PDF", () => {
  it("never includes internal notes", async () => {
    const data = await workspace();
    expect(data.notes.length).toBeGreaterThan(0);
    const model = applicantPdfModel({ ...data, printedBy: "HR", now });
    const text = JSON.stringify(model);
    for (const note of data.notes) expect(text).not.toContain(note.body);
  });

  it("fills the header and sections from the application", async () => {
    const data = await workspace();
    const model = applicantPdfModel({ ...data, printedBy: "Superadmin", now });
    expect(model.name).toBe(data.application.fullName);
    expect(model.meta[0]).toEqual(["ID pelamar", data.application.id]);
    expect(model.sections.map((s) => s.title)).toContain("Referensi dan kontak darurat");
    expect(model.printed).toContain("oleh Superadmin");
    expect(model.history.length).toBe(data.history.length);
  });

  it("makes a safe file name", () => {
    expect(pdfFileName('Arsitek-Rizqi"/../YRAAK7')).toBe("Formulir-Lamaran-Arsitek-RizqiYRAAK7.pdf");
    expect(pdfFileName("")).toBe("Formulir-Lamaran-pelamar.pdf");
  });

  it("keeps Latin text and drops glyphs the font lacks", () => {
    expect(pdfSafeText("Rizqi Fajar — Rp5.500.000 ✨")).toBe("Rizqi Fajar — Rp5.500.000 ");
    expect(pdfSafeText("Şükrü")).toBe("Sükrü");
  });

  it("renders a PDF", async () => {
    const data = await workspace();
    const pdf = await renderApplicantPdf(applicantPdfModel({ ...data, printedBy: "HR", now }));
    expect(pdf.subarray(0, 5).toString()).toBe("%PDF-");
    if (process.env.PDF_OUT) (await import("node:fs")).writeFileSync(process.env.PDF_OUT, pdf);
  }, 30_000);
});
