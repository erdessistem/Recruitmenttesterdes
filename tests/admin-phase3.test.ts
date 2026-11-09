import { describe, expect, it } from "vitest";
import { MemoryRepository } from "@/lib/repositories/memory";
import { createSeedData } from "@/lib/repositories/seed";
import { applyView, attention, daysSince, neighbours, WAITING_DAYS } from "@/lib/admin/attention";
import { listQuery } from "@/lib/admin/filters";

const now = new Date("2026-11-03T00:00:00Z");
const DAY = 86_400_000;
function setup() {
  const seed = createSeedData(now);
  return { seed, repo: new MemoryRepository({ seed, now: () => now }) };
}

describe("applicant rows and attention", () => {
  it("dates each row from its latest stage change", async () => {
    const { repo, seed } = setup();
    const { rows } = await repo.getApplicantList();
    const hr = rows.find((row) => row.application.id === seed.applications[1].id)!;
    expect(daysSince(hr.stageSince, now)).toBe(4);
  });

  it("flags active applicants waiting too long, but not hired or closed ones", async () => {
    const { repo } = setup();
    const later = new Date(now.getTime() + 15 * DAY);
    const { rows } = await repo.getApplicantList();
    const waiting = applyView(rows, "menunggu", later);
    expect(waiting.length).toBeGreaterThan(0);
    expect(waiting.every((row) => row.application.status === "active")).toBe(true);
    expect(applyView(rows, "menunggu", now)).toHaveLength(0);
    expect(applyView(rows, "unknown", now)).toHaveLength(rows.length);
    const todo = attention(rows, [], later);
    expect(todo.unscreened.every((row) => row.application.currentStage === "applied")).toBe(true);
    expect(todo.waiting.every((row) => daysSince(row.stageSince, later) >= WAITING_DAYS)).toBe(true);
  });

  it("lists vacancies closing soon and vacancies whose quota is filled", async () => {
    const { repo, seed } = setup();
    const vacancy = seed.vacancies[1];
    const { rows } = await repo.getApplicantList();
    const filled = rows.map((row) =>
      row.application.vacancyId === vacancy.id && row.application.status === "active"
        ? { ...row, application: { ...row.application, currentStage: "hired" as const } }
        : row,
    );
    const soon = { ...vacancy, closeAt: new Date(now.getTime() + 2 * DAY).toISOString() };
    const todo = attention(filled, [soon], now);
    expect(todo.closingSoon.map((v) => v.id)).toEqual([vacancy.id]);
    expect(todo.quotaFilled.map((item) => item.vacancy.id)).toEqual([vacancy.id]);
  });

  it("finds previous and next applicants in the list", async () => {
    const { repo } = setup();
    const { rows } = await repo.getApplicantList();
    const middle = neighbours(rows, rows[1].application.id)!;
    expect(middle).toMatchObject({ position: 2, total: rows.length });
    expect(middle.previous?.id).toBe(rows[0].application.id);
    expect(middle.next?.id).toBe(rows[2].application.id);
    expect(neighbours(rows, "missing")).toBeNull();
  });

  it("keeps list filters for detail links, without the page", () => {
    expect(listQuery({ stage: "screening", view: "menunggu", page: "3", q: "" })).toBe(
      "?stage=screening&view=menunggu",
    );
    expect(listQuery({})).toBe("");
  });
});

describe("applicant workspace", () => {
  it("returns the application with its history, notes and settings", async () => {
    const { repo, seed } = setup();
    const data = await repo.getApplicantWorkspace(seed.applications[0].id);
    expect(data?.application.id).toBe(seed.applications[0].id);
    expect(data?.history.length).toBeGreaterThan(0);
    expect(data?.settings.waTemplates).toBeDefined();
    expect(await repo.getApplicantWorkspace("missing")).toBeNull();
  });
});

describe("bulk updates", () => {
  it("moves active applicants and skips closed ones with a reason", async () => {
    const { repo, seed } = setup();
    const [active, , rejected] = seed.applications;
    const result = await repo.bulkUpdateApplications(
      [active.id, rejected.id],
      { type: "move", stage: "offering", note: "" },
      "admin@example.com",
    );
    expect(result.updated).toEqual([active.id]);
    expect(result.skipped).toEqual([expect.objectContaining({ id: rejected.id })]);
    expect((await repo.getApplicationById(active.id))?.currentStage).toBe("offering");
    expect((await repo.getStageHistory(active.id)).at(-1)).toMatchObject({ toStage: "offering", changedBy: "admin@example.com" });
  });

  it("skips applicants already in the target stage", async () => {
    const { repo, seed } = setup();
    const result = await repo.bulkUpdateApplications(
      [seed.applications[0].id],
      { type: "move", stage: seed.applications[0].currentStage, note: "" },
      "admin@example.com",
    );
    expect(result.updated).toEqual([]);
    expect(result.skipped).toHaveLength(1);
  });

  it("rejects with an internal reason note on each applicant", async () => {
    const { repo, seed } = setup();
    const ids = [seed.applications[0].id, seed.applications[3].id];
    const result = await repo.bulkUpdateApplications(ids, { type: "reject", reason: "Belum sesuai" }, "admin@example.com");
    expect(result.updated).toEqual(ids);
    for (const id of ids) {
      expect((await repo.getApplicationById(id))?.status).toBe("rejected");
      expect((await repo.getNotes(id)).some((note) => note.body.includes("Belum sesuai"))).toBe(true);
    }
  });

  it("refuses an empty or oversized selection", async () => {
    const { repo } = setup();
    await expect(repo.bulkUpdateApplications([], { type: "reject", reason: "x" }, "a")).rejects.toThrow();
    const many = Array.from({ length: 101 }, (_, index) => `id-${index}`);
    await expect(repo.bulkUpdateApplications(many, { type: "reject", reason: "x" }, "a")).rejects.toThrow();
  });
});
