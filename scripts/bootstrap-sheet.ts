const { loadEnvConfig } = require("@next/env") as typeof import("@next/env");
import { google, type sheets_v4 } from "googleapis";
import { SHEET_HEADERS, type SheetName } from "../lib/sheets/schema";
loadEnvConfig(process.cwd());

async function main() {
  const { getGoogleCredentials, getSpreadsheetId } = await import("../lib/env");
  const { createDefaultSettings } = await import("../lib/repositories/seed");
  const { settingsToRows, rowsToSettings } = await import("../lib/sheets/mappers");
  const id = getSpreadsheetId(), credentials = getGoogleCredentials();
  const client = google.sheets({ version: "v4", auth: new google.auth.JWT({ email: credentials.clientEmail, key: credentials.privateKey, scopes: ["https://www.googleapis.com/auth/spreadsheets"] }) });
  const metadata = await client.spreadsheets.get({ spreadsheetId: id, fields: "sheets(properties(sheetId,title))" });
  const names = Object.keys(SHEET_HEADERS) as SheetName[];
  const ids = new Map(metadata.data.sheets?.map(sheet => [sheet.properties?.title, sheet.properties?.sheetId]) ?? []);
  const existing = names.filter(name => ids.has(name));
  const read = existing.length ? await client.spreadsheets.values.batchGet({ spreadsheetId: id, ranges: existing.map(name => `'${name}'!A:AZ`), valueRenderOption: "UNFORMATTED_VALUE" }) : null;
  const needsHeaders: SheetName[] = [];
  let settingsEmpty = true;
  for (let i = 0; i < existing.length; i++) {
    const name = existing[i], rows = read?.data.valueRanges?.[i]?.values ?? [];
    if (!rows.length || !rows.some(row => row.some(value => value !== ""))) { needsHeaders.push(name); continue; }
    const expected = SHEET_HEADERS[name];
    if (!rows[0] || rows[0].length !== expected.length || expected.some((header, index) => rows[0][index] !== header)) throw new Error(`Header ${name} tidak sesuai; tidak ada perubahan dilakukan.`);
    if (name === "Settings") {
      const data = rows.slice(1).filter(row => row[0]);
      if (data.length) { const settings = rowsToSettings(data); const keys = settingsToRows(settings).map(row => row[0]); if (data.length !== keys.length || data.some((row, index) => row[0] !== keys[index])) throw new Error("Urutan Settings tidak sesuai."); settingsEmpty = false; }
    }
  }
  const missing = names.filter(name => !ids.has(name));
  if (missing.length) {
    const added = await client.spreadsheets.batchUpdate({ spreadsheetId: id, requestBody: { requests: missing.map(title => ({ addSheet: { properties: { title, gridProperties: { frozenRowCount: 1 } } } })) } });
    added.data.replies?.forEach((reply, index) => ids.set(missing[index], reply.addSheet?.properties?.sheetId));
    needsHeaders.push(...missing);
  }
  const requests: sheets_v4.Schema$Request[] = [];
  const toCells = (values: readonly (string | number | boolean)[]) => ({ values: values.map(value => ({ userEnteredValue: typeof value === "number" ? { numberValue: value } : typeof value === "boolean" ? { boolValue: value } : { stringValue: value } })) });
  for (const name of names) {
    const sheetId = ids.get(name); if (sheetId == null) throw new Error(`Tab ${name} tidak tersedia.`);
    const grid: sheets_v4.Schema$GridProperties = { frozenRowCount: 1 };
    // Only empty tabs are resized, so existing data can never be cut off. New tabs default to 26 columns.
    if (needsHeaders.includes(name)) grid.columnCount = Math.max(26, SHEET_HEADERS[name].length);
    requests.push({ updateSheetProperties: { properties: { sheetId, gridProperties: grid }, fields: grid.columnCount ? "gridProperties.frozenRowCount,gridProperties.columnCount" : "gridProperties.frozenRowCount" } });
    if (needsHeaders.includes(name)) requests.push({ updateCells: { start: { sheetId, rowIndex: 0, columnIndex: 0 }, rows: [toCells(SHEET_HEADERS[name])], fields: "userEnteredValue" } });
    if (name === "Settings" && settingsEmpty) requests.push({ updateCells: { start: { sheetId, rowIndex: 1, columnIndex: 0 }, rows: settingsToRows(createDefaultSettings()).map(toCells), fields: "userEnteredValue" } });
  }
  if (requests.length) await client.spreadsheets.batchUpdate({ spreadsheetId: id, requestBody: { requests } });
  process.stdout.write("Skema spreadsheet siap. Periksa dan lindungi baris header di Google Sheets.\n");
}
main().catch(error => { process.stderr.write(`Bootstrap gagal: ${error instanceof Error ? error.message : "kesalahan tidak diketahui"}\n`); process.exitCode = 1; });
