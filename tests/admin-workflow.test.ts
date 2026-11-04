import { describe, expect, it } from "vitest";
import { MemoryRepository } from "@/lib/repositories/memory";
import { createSeedData } from "@/lib/repositories/seed";
import { moveStage, rejectApplication, reopenApplication } from "@/lib/admin/workflow";
import { applicantsCsv, csvCell } from "@/lib/admin/csv";
import { createWhatsAppMessage } from "@/lib/admin/templates";
import { rowToRecord, recordToRow } from "@/lib/sheets/mappers";
import { SHEET_HEADERS } from "@/lib/sheets/schema";
import { toRepositoryFilters } from "@/lib/admin/filters";

const now = new Date("2026-11-03T00:00:00Z");
function setup() { const seed = createSeedData(now); return { seed, repo: new MemoryRepository({ seed, now: () => now }), app: seed.applications[0] }; }
describe("admin workflow", () => {
  it("records skips and backward moves, and stores an explicit public note", async () => {
    const { repo, app } = setup();
    await moveStage(repo, app.id, "offering", "Harap tunggu kabar kami.", "admin@example.com");
    let history = await repo.getStageHistory(app.id);
    expect(history.at(-1)).toMatchObject({ fromStage: "screening", toStage: "offering", noteIsPublic: true });
    await moveStage(repo, app.id, "applied", "", "admin@example.com");
    history = await repo.getStageHistory(app.id);
    expect(history.at(-1)).toMatchObject({ fromStage: "offering", toStage: "applied" });
    expect(history.at(-1)?.noteIsPublic).toBeUndefined();
  });
  it("keeps rejection reasons internal and allows reopening; hired and withdrawn are locked", async () => {
    const { repo, app } = setup();
    await rejectApplication(repo, app.id, "Kualifikasi belum sesuai", "admin@example.com");
    expect((await repo.getApplicationById(app.id))?.status).toBe("rejected");
    expect(JSON.stringify(await repo.getStageHistory(app.id))).not.toContain("Kualifikasi belum sesuai");
    expect((await repo.getNotes(app.id)).some(note => note.body.includes("Kualifikasi belum sesuai"))).toBe(true);
    await reopenApplication(repo, app.id, "admin@example.com");
    expect((await repo.getApplicationById(app.id))?.status).toBe("active");
    await moveStage(repo, app.id, "hired", "", "admin@example.com");
    await expect(rejectApplication(repo, app.id, "Alasan", "admin@example.com")).rejects.toThrow();
    const withdrawn = (await repo.getApplications({ status: "withdrawn" }))[0];
    await expect(moveStage(repo, withdrawn.id, "screening", "", "admin@example.com")).rejects.toThrow();
  });
  it("reconciles an application from its latest history", async () => {
    const { repo, app } = setup();
    await repo.appendStageHistory({ applicationId: app.id, fromStage: app.currentStage, toStage: "offering", fromStatus: "active", toStatus: "active", note: "", changedBy: "admin", changedAt: now.toISOString() });
    expect((await repo.reconcileApplicationStage(app.id))?.currentStage).toBe("offering");
  });
  it("reconciles all applications in one call and reports only changed rows", async () => {
    const { repo, app } = setup();
    expect(await repo.reconcileAllApplicationStages()).toBe(0);
    await repo.appendStageHistory({ applicationId: app.id, fromStage: app.currentStage, toStage: "offering", fromStatus: "active", toStatus: "active", note: "", changedBy: "admin", changedAt: now.toISOString() });
    expect(await repo.reconcileAllApplicationStages()).toBe(1);
    expect((await repo.getApplicationById(app.id))?.currentStage).toBe("offering");
  });
  it("keeps old history notes private in Sheet mappings", async () => {
    const { repo, app, seed } = setup();
    const legacy = seed.stageHistory[1];
    const headers = SHEET_HEADERS.Stage_History.filter(h => h !== "note_is_public");
    expect(rowToRecord("Stage_History", headers, recordToRow("Stage_History", legacy).slice(0, -1)).noteIsPublic).toBeUndefined();
    await moveStage(repo, app.id, "offering", "Catatan publik", "admin");
    const event = (await repo.getStageHistory(app.id)).at(-1)!;
    expect(rowToRecord("Stage_History", SHEET_HEADERS.Stage_History, recordToRow("Stage_History", event)).noteIsPublic).toBe(true);
  });
  it("escapes formula-like values and excludes credentials from CSV", () => {
    const { seed, app } = setup();
    expect(csvCell("  =1+1")).toBe('"\'  =1+1"');
    expect(csvCell("a,\"b\"\nline")).toBe('"a,""b""\nline"');
    const csv = applicantsCsv([{ ...app, fullName: "+SUM(1,2)" }], seed.vacancies);
    expect(csv.startsWith("\uFEFF")).toBe(true);
    expect(csv).toContain('"\'+SUM(1,2)"');
    expect(csv).not.toContain(app.token);
    expect(csv).not.toContain(app.submissionKey);
    expect(csv).not.toContain(seed.notes[0].body);
  });
  it("uses the same Jakarta date boundaries for list and export and fills templates", () => {
    const { seed, app } = setup();
    expect(toRepositoryFilters({ from: "2026-11-03", to: "2026-11-03" })).toMatchObject({ appliedFrom: "2026-11-02T17:00:00.000Z", appliedTo: "2026-11-03T16:59:59.999Z" });
    const message = createWhatsAppMessage(app, seed.vacancies[0], seed.settings, "http://localhost:3000");
    expect(message).toContain(app.fullName);
    expect(message).toContain(`/lacak/${app.token}`);
  });
});
