import { afterEach, describe, expect, it, vi } from "vitest";
import { MemoryRepository } from "@/lib/repositories/memory";
import { createSeedData } from "@/lib/repositories/seed";
import { lookupApplication, recoverApplications, revealRecoveredId, withdrawApplication } from "@/lib/public/tracking";
import { allowAttempt } from "@/lib/security/rate-limit";

afterEach(() => vi.restoreAllMocks());

const now = new Date("2026-11-03T00:00:00Z");
function setup() { const seed = createSeedData(now); return { repo: new MemoryRepository({ seed, now: () => now }), application: seed.applications[0] }; }
describe("candidate tracking", () => {
  it("looks up by normalized Applicant ID alone", async () => {
    const { repo, application } = setup();
    const input = { applicant_id: application.id.toLowerCase().replaceAll("-", " ") };
    expect((await lookupApplication(repo, input))?.id).toBe(application.id);
    expect(await lookupApplication(repo, { applicant_id: "unknown" })).toBeNull();
    expect(await lookupApplication(repo, { applicant_id: "" })).toBeNull();
  });
  it("returns masked recovery results and one-use opaque reveal handles without tokens", async () => {
    const { repo, application } = setup();
    const results = await recoverApplications(repo, { full_name: "  BUDI   SANTOSO ", whatsapp: "081234567890" });
    expect(results).toHaveLength(1);
    expect(JSON.stringify(results)).not.toContain(application.id);
    expect(JSON.stringify(results)).not.toContain(application.token);
    expect(await revealRecoveredId(repo, results[0].handle)).toBe(application.id);
    expect(await revealRecoveredId(repo, results[0].handle)).toBeNull();
    const expired = await recoverApplications(repo, { full_name: "Budi Santoso", whatsapp: "081234567890" });
    const later = Date.now() + 300_001;
    vi.spyOn(Date, "now").mockReturnValue(later);
    expect(await revealRecoveredId(repo, expired[0].handle)).toBeNull();
    expect(await revealRecoveredId(repo, "not a handle")).toBeNull();
  });
  it("requires both identity factors to withdraw and records candidate history", async () => {
    const { repo, application } = setup();
    const input = { applicant_id: application.id, whatsapp: "081234567890" };
    expect((await withdrawApplication(repo, application.token, { ...input, whatsapp: "081111111111" })).ok).toBe(false);
    expect((await withdrawApplication(repo, "wrong-token", input)).ok).toBe(false);
    expect((await withdrawApplication(repo, application.token, input)).ok).toBe(true);
    expect((await repo.getApplicationById(application.id))?.status).toBe("withdrawn");
    expect((await repo.getStageHistory(application.id)).at(-1)).toMatchObject({ changedBy: "candidate", toStatus: "withdrawn" });
    expect((await withdrawApplication(repo, application.token, input)).ok).toBe(false);
  });
  it("blocks withdrawal of hired applications", async () => {
    const { repo, application } = setup();
    await repo.updateApplicationStage(application.id, "hired", "active", "", "admin");
    expect((await withdrawApplication(repo, application.token, { applicant_id: application.id, whatsapp: "081234567890" })).ok).toBe(false);
  });
  it("limits attempts within a window", async () => {
    expect(await allowAttempt("test", "unique", 2, 1000, 10000)).toBe(true);
    expect(await allowAttempt("test", "unique", 2, 1000, 10001)).toBe(true);
    expect(await allowAttempt("test", "unique", 2, 1000, 10002)).toBe(false);
    expect(await allowAttempt("test", "unique", 2, 1000, 11002)).toBe(true);
  });
});
