import { describe, expect, it } from "vitest";
import { normalizeWhatsApp } from "@/lib/format/phone";
import { jakartaDateOnlyToUtc, isDateOnlyString } from "@/lib/format/date";
import { parseRupiahInput } from "@/lib/format/currency";
import { vacancyFormSchema } from "@/lib/validation/vacancy";
import { applicationFormSchema, isFormTooFast } from "@/lib/validation/application";
import { MemoryRepository } from "@/lib/repositories/memory";
import { createSeedData } from "@/lib/repositories/seed";
import { recordToRow, rowToRecord, rowsToSettings, settingsToRows } from "@/lib/sheets/mappers";
import { SHEET_HEADERS } from "@/lib/sheets/schema";
import { parseEnv } from "@/lib/env";

describe("foundation", () => {
  it("normalizes phones, currency, and Jakarta date boundaries", () => {
    expect(normalizeWhatsApp("+62 812-3456-7890")).toBe("6281234567890");
    expect(normalizeWhatsApp("0812 3456 7890")).toBe("6281234567890");
    expect(normalizeWhatsApp("123")).toBeNull();
    expect(parseRupiahInput("Rp8.500.000")).toBe(8500000);
    expect(jakartaDateOnlyToUtc("2026-11-03", "end")).toBe("2026-11-03T16:59:59.999Z");
    expect(isDateOnlyString("2026-02-30")).toBe(false);
  });
  it("validates vacancy form strings and rejects impossible dates", () => {
    const form = { title: "Admin", slug: "admin", position_code: "Admin", department: "Operasional", location: "Jakarta", employment_type: "full_time", description: "Deskripsi lengkap", requirements: "Persyaratan lengkap", quota: "2", open_at: "2026-11-03", close_at: "2026-11-03", status: "open" };
    expect(vacancyFormSchema.parse(form).quota).toBe(2);
    expect(vacancyFormSchema.safeParse({ ...form, close_at: "2026-02-30" }).success).toBe(false);
  });
  it("validates application conditional fields and anti-spam timing", () => {
    const form = { full_name: "Budi Santoso", whatsapp: "081234567890", city: "Jakarta", last_education: "s1", experience_years: "0", last_salary: "0", expected_salary: "5.000.000", motivation: "Saya ingin bergabung dan berkembang bersama perusahaan.", availability: "immediately", source: "other", consent: true };
    expect(applicationFormSchema.safeParse(form).success).toBe(false);
    expect(applicationFormSchema.parse({ ...form, source_other: "Acara" }).whatsapp).toBe("6281234567890");
    expect(isFormTooFast(1000, 3999)).toBe(true);
    expect(isFormTooFast(1000, 4000)).toBe(false);
  });
  it("round trips all sheet records and settings without changing types", () => {
    const seed = createSeedData(new Date("2026-11-03T00:00:00Z"));
    const entries = [["Vacancies", seed.vacancies[0]], ["Applications", seed.applications[0]], ["Stage_History", seed.stageHistory[0]], ["Notes", seed.notes[0]], ["Admin_Users", seed.adminUsers[0]]] as const;
    for (const [sheet, record] of entries) {
      // The union is safe here because each tuple pairs its sheet and corresponding record.
      const row = recordToRow(sheet, record);
      expect(rowToRecord(sheet, SHEET_HEADERS[sheet], row)).toEqual(record);
    }
    expect(rowsToSettings(settingsToRows(seed.settings))).toEqual(seed.settings);
    expect(() => rowToRecord("Vacancies", ["id"], ["VAC-1"])).toThrow();
  });
  it("uses seed data, honors idempotency, and returns isolated copies", async () => {
    const seed = createSeedData(new Date("2026-11-03T00:00:00Z"));
    const repo = new MemoryRepository({ seed, now: () => new Date("2026-11-03T00:00:00Z") });
    expect(await repo.getOpenVacancies()).toHaveLength(2);
    const first = seed.applications[0];
    expect(await repo.appendApplication({ ...first, id: "different" })).toEqual(first);
    const vacancy = await repo.getVacancyById("VAC-0001");
    vacancy!.title = "Changed";
    expect((await repo.getVacancyById("VAC-0001"))?.title).not.toBe("Changed");
  });
  it("allows offline configuration but rejects partial credentials", () => {
    expect(parseEnv({}).NEXT_PUBLIC_APP_URL).toBe("http://localhost:3000");
    expect(() => parseEnv({ GOOGLE_SHEETS_ID: "id" })).toThrow();
  });
});
