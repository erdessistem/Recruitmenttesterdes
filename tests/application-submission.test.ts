import { describe, expect, it } from "vitest";
import { MemoryRepository } from "@/lib/repositories/memory";
import { createSeedData } from "@/lib/repositories/seed";
import { submitApplication } from "@/lib/public/submit-application";

const now = new Date("2026-11-03T00:00:00Z");
const input = { full_name: "Ani Putri", whatsapp: "081234567899", city: "Jakarta", reference_name: "Hendra Wijaya", reference_phone: "081300000999", emergency_name: "Sri Rahayu", emergency_relation: "Ibu", emergency_phone: "081900000999", last_education: "s1", experience_years: "0", last_salary: "0", expected_salary: "5.000.000", motivation: "Saya ingin bergabung dan berkembang bersama perusahaan.", availability: "immediately", source: "website", consent: true, form_started_at: now.getTime() - 5000 };
const key = "12345678-1234-4234-8234-123456789abc";
describe("application submissions", () => {
  it("creates a unique application and history, and retries return the same token", async () => {
    const repo = new MemoryRepository({ seed: createSeedData(now), now: () => now });
    const result = await submitApplication(repo, "admin", input, key, now);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const saved = await repo.getApplicationByToken(result.token);
    expect(saved?.id).toMatch(/^Admin-AniPutri-[A-Z2-9]{6}$/);
    expect(saved?.consentAt).toBe(now.toISOString());
    expect(saved?.privacyVersion).toBeTruthy();
    expect(await repo.getStageHistory(saved!.id)).toHaveLength(1);
    expect(await submitApplication(repo, "admin", input, key, now)).toEqual(result);
    expect(await submitApplication(repo, "admin", input, "22345678-1234-4234-8234-123456789abc", now)).toMatchObject({ ok: false, duplicate: true });
  });
  it("rejects invalid, fast and closed submissions", async () => {
    const repo = new MemoryRepository({ seed: createSeedData(now), now: () => now });
    expect(await submitApplication(repo, "admin", { ...input, expected_salary: "0" }, key, now)).toMatchObject({ ok: false, errors: { expected_salary: expect.any(Array) } });
    expect(await submitApplication(repo, "admin", { ...input, form_started_at: now.getTime() }, key, now)).toMatchObject({ ok: false });
    expect(await submitApplication(repo, "marketing", input, key, now)).toMatchObject({ ok: false });
  });
});
