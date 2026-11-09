import "server-only";
import type { sheets_v4 } from "googleapis";
import { createSheetsClient } from "@/lib/sheets/client";
import { getSpreadsheetId } from "@/lib/env";
import { recordToRow, rowToRecord, rowsToSettings, settingsToRows } from "@/lib/sheets/mappers";
import { SHEET_HEADERS, acceptsHeaders, type SheetName } from "@/lib/sheets/schema";
import { MemoryRepository } from "./memory";
import { withWriteLock } from "@/lib/security/write-lock";
import type { SeedData } from "./seed";
import type { Repository } from "./types";

type DataSheet = Exclude<SheetName, "Settings">;
type Item = { id: string };
/** widths: how many header columns each tab has, so optional columns without a header are never written. */
type Snapshot = { data: SeedData; rowIndexes: Record<SheetName, number[]>; sheetIds: Record<SheetName, number>; widths: Record<SheetName, number> };
const names = Object.keys(SHEET_HEADERS) as SheetName[];
const properties = { Vacancies: "vacancies", Applications: "applications", Stage_History: "stageHistory", Notes: "notes", Admin_Users: "adminUsers" } as const;
const mutationMethods = new Set(["createVacancy", "updateVacancy", "appendApplication", "updateApplicationStage", "appendStageHistory", "reconcileApplicationStage", "reconcileAllApplicationStages", "addNote", "updateSettings", "createAdmin", "updateAdminPassword", "recordAdminLogin", "anonymizeExpiredApplications", "getApplicantWorkspace", "getDashboardData", "bulkUpdateApplications", "addAdmin", "updateAdmin"]);

/** Exact headers prevent writing canonical columns into a reordered sheet. */
export function validateHeaders(sheet: SheetName, headers: readonly unknown[]) {
  if (!acceptsHeaders(sheet, headers)) throw new Error(`Header ${sheet} tidak sesuai. Jalankan pemeriksaan skema sebelum melanjutkan.`);
}
function cell(value: string | number | boolean): sheets_v4.Schema$CellData {
  return { userEnteredValue: typeof value === "number" ? { numberValue: value } : typeof value === "boolean" ? { boolValue: value } : { stringValue: value } };
}
function row(values: readonly (string | number | boolean)[]): sheets_v4.Schema$RowData { return { values: values.map(cell) }; }
function valuesFor(sheet: DataSheet, item: Item) { return recordToRow(sheet, item as never); }

/** A single atomic Sheets batch is used per repository mutation. Google Sheets does not provide compare-and-swap across concurrent writers. */
export function createSheetsRepository(client: sheets_v4.Sheets = createSheetsClient(), spreadsheetId = getSpreadsheetId()): Repository {
  async function load(): Promise<Snapshot> {
    const [metadata, response] = await Promise.all([
      client.spreadsheets.get({ spreadsheetId, fields: "sheets(properties(sheetId,title))" }),
      client.spreadsheets.values.batchGet({ spreadsheetId, ranges: names.map(name => `'${name}'!A:AZ`), valueRenderOption: "UNFORMATTED_VALUE" }),
    ]);
    const sheetIds = {} as Record<SheetName, number>;
    const rowIndexes = {} as Record<SheetName, number[]>;
    const widths = {} as Record<SheetName, number>;
    const records: Partial<Record<DataSheet, unknown[]>> = {};
    let settings: SeedData["settings"] | undefined;
    for (let index = 0; index < names.length; index++) {
      const name = names[index];
      const sheet = metadata.data.sheets?.find(item => item.properties?.title === name);
      if (sheet?.properties?.sheetId == null) throw new Error(`Tab ${name} tidak ditemukan.`);
      sheetIds[name] = sheet.properties.sheetId;
      const rows = response.data.valueRanges?.[index]?.values ?? [];
      validateHeaders(name, rows[0] ?? []);
      widths[name] = (rows[0] ?? []).length;
      const present = rows.slice(1).map((values, offset) => ({ values, rowIndex: offset + 1 })).filter(item => item.values[0] !== "" && item.values[0] != null);
      rowIndexes[name] = present.map(item => item.rowIndex);
      if (name === "Settings") {
        settings = rowsToSettings(present.map(item => item.values));
        const expectedKeys = settingsToRows(settings).map(item => item[0]);
        if (present.length !== expectedKeys.length || present.some((item, i) => item.values[0] !== expectedKeys[i])) throw new Error("Urutan kunci Settings tidak sesuai.");
      }
      else records[name] = present.map(item => rowToRecord(name, rows[0] as string[], item.values));
    }
    if (!settings) throw new Error("Pengaturan belum diinisialisasi.");
    return { data: { vacancies: records.Vacancies as SeedData["vacancies"], applications: records.Applications as SeedData["applications"], stageHistory: records.Stage_History as SeedData["stageHistory"], notes: records.Notes as SeedData["notes"], adminUsers: records.Admin_Users as SeedData["adminUsers"], settings }, rowIndexes, sheetIds, widths };
  }
  async function commit(before: Snapshot, after: SeedData) {
    const requests: sheets_v4.Schema$Request[] = [];
    // Append history before application updates in the atomic batch.
    const order: DataSheet[] = ["Stage_History", "Notes", "Vacancies", "Applications", "Admin_Users"];
    for (const name of order) {
      const key = properties[name];
      const oldItems = before.data[key] as Item[], newItems = after[key] as Item[];
      const remainingNotes = name === "Notes" ? new Map(newItems.map(item => [item.id, item])) : null;
      oldItems.forEach((old, index) => {
        const current = remainingNotes ? remainingNotes.get(old.id) : newItems[index];
        if (JSON.stringify(old) === JSON.stringify(current)) return;
        const values = (current ? valuesFor(name, current) : SHEET_HEADERS[name].map(() => "")).slice(0, before.widths[name]);
        requests.push({ updateCells: { start: { sheetId: before.sheetIds[name], rowIndex: before.rowIndexes[name][index], columnIndex: 0 }, rows: [row(values)], fields: "userEnteredValue" } });
      });
      const appended = remainingNotes ? newItems.filter(item => !oldItems.some(old => old.id === item.id)) : newItems.slice(oldItems.length);
      if (appended.length) requests.push({ appendCells: { sheetId: before.sheetIds[name], rows: appended.map(item => row(valuesFor(name, item).slice(0, before.widths[name]))), fields: "userEnteredValue" } });
    }
    const oldSettings = settingsToRows(before.data.settings), newSettings = settingsToRows(after.settings);
    oldSettings.forEach((old, index) => {
      if (JSON.stringify(old) !== JSON.stringify(newSettings[index])) requests.push({ updateCells: { start: { sheetId: before.sheetIds.Settings, rowIndex: before.rowIndexes.Settings[index], columnIndex: 0 }, rows: [row(newSettings[index])], fields: "userEnteredValue" } });
    });
    if (requests.length) await client.spreadsheets.batchUpdate({ spreadsheetId, requestBody: { requests } });
  }
  return new Proxy({} as Repository, {
    get(_target, property) {
      if (typeof property !== "string" || property === "then") return undefined;
      return async (...args: unknown[]) => {
        const run = async () => {
          const before = await load();
          const memory = new MemoryRepository({ seed: before.data });
          const method = (memory as unknown as Record<string, (...args: unknown[]) => Promise<unknown>>)[property];
          if (typeof method !== "function") throw new Error(`Unknown repository operation: ${property}`);
          const result = await method.apply(memory, args);
          if (mutationMethods.has(property)) await commit(before, memory.exportSnapshot());
          return result;
        };
        // Writes load, change and save under one lock, so a concurrent write cannot be lost.
        return mutationMethods.has(property) ? withWriteLock(run) : run();
      };
    },
  });
}
