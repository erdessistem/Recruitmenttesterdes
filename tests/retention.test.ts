import { describe, expect, it } from "vitest";
import { MemoryRepository } from "@/lib/repositories/memory";
import { createSeedData } from "@/lib/repositories/seed";
import { isRetentionEligible } from "@/lib/admin/retention";

describe("retention cleanup", () => {
  it("uses closed date, removes identifying data and notes, and preserves aggregate history", async () => {
    const now = new Date("2026-11-03T00:00:00.000Z");
    const seed = createSeedData(now);
    const application = seed.applications[0];
    application.status = "rejected"; application.closedAt = "2025-10-01T00:00:00.000Z";
    seed.stageHistory[1].note = "Private text about Budi"; seed.stageHistory[1].noteIsPublic = true;
    const originalId = application.id, originalToken = application.token;
    const repo = new MemoryRepository({ seed, now: () => now });
    expect(isRetentionEligible(application, 12, now)).toBe(true);
    expect(isRetentionEligible({ ...application, status: "active" }, 12, now)).toBe(false);
    expect(isRetentionEligible({ ...application, closedAt: "2025-11-03T00:00:00.000Z" }, 12, now)).toBe(false);
    const result = await repo.anonymizeExpiredApplications(12, now);
    expect(result.count).toBe(1); expect(result.ids[0]).toMatch(/^ANON-[A-Z2-9]{6}$/);
    expect(await repo.getApplicationById(originalId)).toBeNull(); expect(await repo.getApplicationByToken(originalToken)).toBeNull();
    const anonymized = await repo.getApplicationById(result.ids[0]);
    expect(anonymized).toMatchObject({ fullName: "", whatsapp: "", email: "", city: "", motivation: "", token: "", submissionKey: "", lastSalary: 0, expectedSalary: 0, vacancyId: application.vacancyId, lastEducation: application.lastEducation, anonymizedAt: now.toISOString() });
    expect(await repo.getNotes(originalId)).toEqual([]); expect(await repo.getNotes(result.ids[0])).toEqual([]);
    const history = await repo.getStageHistory(result.ids[0]);
    expect(history.length).toBeGreaterThan(0); expect(history.every(entry => !entry.note && !entry.noteIsPublic)).toBe(true);
    expect(await repo.getSettings()).toMatchObject({ lastPurgeAt: now.toISOString(), lastPurgeCount: 1 });
    expect((await repo.anonymizeExpiredApplications(12, now)).count).toBe(0);
  });
});
