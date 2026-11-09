import { describe, expect, it } from "vitest";
import type { sheets_v4 } from "googleapis";
import { createSheetsRepository, validateHeaders } from "@/lib/repositories/sheets";
import { SHEET_HEADERS, type SheetName } from "@/lib/sheets/schema";
import { recordToRow, settingsToRows } from "@/lib/sheets/mappers";
import { createSeedData } from "@/lib/repositories/seed";

function fakeSheets() {
  const seed = createSeedData(new Date("2026-11-03T00:00:00Z"));
  const names = Object.keys(SHEET_HEADERS) as SheetName[];
  const grids: Record<string, unknown[][]> = {
    Vacancies: [Array.from(SHEET_HEADERS.Vacancies), ...seed.vacancies.map(item => recordToRow("Vacancies", item))],
    Applications: [Array.from(SHEET_HEADERS.Applications), ...seed.applications.map(item => recordToRow("Applications", item))],
    Stage_History: [Array.from(SHEET_HEADERS.Stage_History), ...seed.stageHistory.map(item => recordToRow("Stage_History", item))],
    Notes: [Array.from(SHEET_HEADERS.Notes), ...seed.notes.map(item => recordToRow("Notes", item))],
    Admin_Users: [Array.from(SHEET_HEADERS.Admin_Users), ...seed.adminUsers.map(item => recordToRow("Admin_Users", item))],
    Settings: [Array.from(SHEET_HEADERS.Settings), ...settingsToRows(seed.settings)],
  };
  const calls: sheets_v4.Schema$Request[][] = [];
  function cells(row: sheets_v4.Schema$RowData) { return (row.values ?? []).map(c => c.userEnteredValue?.stringValue ?? c.userEnteredValue?.numberValue ?? c.userEnteredValue?.boolValue ?? ""); }
  const client = { spreadsheets: {
    get: async () => ({ data: { sheets: names.map((name, id) => ({ properties: { title: name, sheetId: id } })) } }),
    values: { batchGet: async () => ({ data: { valueRanges: names.map(name => ({ values: structuredClone(grids[name]) })) } }) },
    batchUpdate: async ({ requestBody }: { requestBody: { requests: sheets_v4.Schema$Request[] } }) => {
      calls.push(requestBody.requests);
      for (const request of requestBody.requests) {
        if (request.updateCells) { const change = request.updateCells; grids[names[change.start!.sheetId!]][change.start!.rowIndex!] = cells(change.rows![0]); }
        if (request.appendCells) { const change = request.appendCells; grids[names[change.sheetId!]].push(...change.rows!.map(cells)); }
      }
      return { data: {} };
    },
  } } as unknown as sheets_v4.Sheets;
  return { client, seed, grids, calls };
}
describe("Sheets repository", () => {
  it("rejects reordered headers rather than writing to wrong columns", () => {
    expect(() => validateHeaders("Vacancies", [...SHEET_HEADERS.Vacancies].reverse())).toThrow();
  });
  it("keeps working on a sheet that has not added the last_position header yet", async () => {
    const { client, grids, seed } = fakeSheets();
    grids.Applications = grids.Applications.map(row => row.slice(0, -2));
    const repo = createSheetsRepository(client, "test");
    const application = await repo.getApplicationById(seed.applications[0].id);
    expect(application?.fullName).toBe(seed.applications[0].fullName);
    expect(application?.lastPosition).toBe("");
    expect(() => validateHeaders("Applications", SHEET_HEADERS.Applications.slice(0, -3))).toThrow();
  });
  it("loads and writes sheets that have not added the newest optional columns", async () => {
    const { client, grids, seed, calls } = fakeSheets();
    grids.Vacancies = grids.Vacancies.map(row => row.slice(0, -4));
    grids.Applications = grids.Applications.map(row => row.slice(0, -2));
    const repo = createSheetsRepository(client, "test");
    const vacancy = await repo.getVacancyById(seed.vacancies[1].id);
    expect(vacancy).toMatchObject({ salaryMin: null, salaryVisible: false, screeningQuestions: [] });
    await repo.updateVacancy(seed.vacancies[1].id, { title: "Guru Matematika SMA" });
    const written = calls.flat().find(request => request.updateCells)?.updateCells?.rows?.[0].values ?? [];
    expect(written).toHaveLength(SHEET_HEADERS.Vacancies.length - 4);
    expect(() => validateHeaders("Vacancies", SHEET_HEADERS.Vacancies.slice(0, -5))).toThrow();
  });
  it("round-trips salary and screening JSON when the headers exist", async () => {
    const { client, seed } = fakeSheets();
    const repo = createSheetsRepository(client, "test");
    const vacancy = await repo.getVacancyById(seed.vacancies[1].id);
    expect(vacancy?.salaryMin).toBe(5_000_000);
    expect(vacancy?.screeningQuestions[0]).toMatchObject({ id: "penempatan", expected: "yes" });
    const siti = await repo.getApplicationById(seed.applications[1].id);
    expect(siti?.screeningAnswers[0]).toMatchObject({ answer: "no" });
  });
  it("keeps both of two simultaneous writes", async () => {
    const { client, seed } = fakeSheets();
    const repo = createSheetsRepository(client, "test");
    const id = seed.applications[0].id;
    const before = (await repo.getNotes(id)).length;
    const [first, second] = await Promise.all([
      repo.addNote(id, "a@example.com", "Catatan pertama"),
      repo.addNote(id, "b@example.com", "Catatan kedua"),
    ]);
    expect(first.id).not.toBe(second.id);
    const notes = await createSheetsRepository(client, "test").getNotes(id);
    expect(notes).toHaveLength(before + 2);
  });
  it("saves a bulk update in a single write", async () => {
    const { client, seed, calls } = fakeSheets();
    const repo = createSheetsRepository(client, "test");
    const ids = [seed.applications[0].id, seed.applications[1].id];
    const result = await repo.bulkUpdateApplications(ids, { type: "move", stage: "offering", note: "" }, "admin@example.com");
    expect(result.updated).toEqual(ids);
    expect(calls).toHaveLength(1);
    const repo2 = createSheetsRepository(client, "test");
    for (const id of ids) expect((await repo2.getApplicationById(id))?.currentStage).toBe("offering");
  });
  it("reads seed records, writes literal data, and preserves updates across instances", async () => {
    const { client, seed, calls } = fakeSheets();
    const repo = createSheetsRepository(client, "test");
    expect((await repo.getVacancyBySlug("admin"))?.title).toBe("Admin");
    const created = await repo.createVacancy({ slug: "posisi-baru", title: "=Formula", positionCode: "Posisi", department: "Operasional", location: "Jakarta", employmentType: "full_time", description: "Deskripsi posisi", requirements: "Persyaratan posisi", quota: 1, openAt: null, closeAt: null, status: "draft" });
    const repo2 = createSheetsRepository(client, "test");
    expect((await repo2.getVacancyById(created.id))?.title).toBe("=Formula");
    const appended = calls.flat().find(request => request.appendCells)?.appendCells?.rows?.[0].values;
    expect(appended?.some(cell => cell.userEnteredValue?.stringValue === "=Formula")).toBe(true);
    const applicant = seed.applications[0];
    await repo.updateApplicationStage(applicant.id, "offering", "active", "Kabar publik", "admin@example.com", true);
    expect((await repo2.getApplicationById(applicant.id))?.currentStage).toBe("offering");
    expect((await repo2.getStageHistory(applicant.id)).at(-1)).toMatchObject({ toStage: "offering", noteIsPublic: true });
  });
});
