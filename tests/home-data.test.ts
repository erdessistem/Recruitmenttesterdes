import { describe, expect, it } from "vitest";
import { MemoryRepository } from "@/lib/repositories/memory";
import { createSeedData } from "@/lib/repositories/seed";

const now = new Date("2026-11-03T00:00:00Z");

describe("home page data", () => {
  it("returns the same open vacancies as getOpenVacancies plus the company profile", async () => {
    const seed = createSeedData(now);
    const repo = new MemoryRepository({ seed, now: () => now });
    const data = await repo.getHomePageData(now);
    expect(data.vacancies.map((v) => v.id)).toEqual(
      (await repo.getOpenVacancies(now)).map((v) => v.id),
    );
    expect(data.companyProfile).toEqual(seed.settings.companyProfile);
  });
  it("returns a vacancy with the other open vacancies, excluding itself", async () => {
    const seed = createSeedData(now);
    const repo = new MemoryRepository({ seed, now: () => now });
    const open = await repo.getOpenVacancies(now);
    const data = await repo.getVacancyPageData(open[0].slug, now);
    expect(data.vacancy?.id).toBe(open[0].id);
    expect(data.others.map((v) => v.id)).toEqual(open.slice(1).map((v) => v.id));
    expect((await repo.getVacancyPageData("tidak-ada", now)).vacancy).toBeNull();
  });
  it("returns everything a token page needs, or null for an unknown token", async () => {
    const seed = createSeedData(now);
    const repo = new MemoryRepository({ seed, now: () => now });
    const app = seed.applications[0];
    const data = await repo.getTrackingPageData(app.token);
    expect(data?.application.id).toBe(app.id);
    expect(data?.vacancy?.id).toBe(app.vacancyId);
    expect(data?.history).toEqual(await repo.getStageHistory(app.id));
    expect(await repo.getTrackingPageData("tidak-ada")).toBeNull();
  });
});
