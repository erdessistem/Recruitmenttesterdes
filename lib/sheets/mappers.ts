import "server-only";
import type { AdminUser, Application, InternalNote, Settings, StageHistoryEntry, Vacancy } from "@/lib/repositories/types";
import { SHEET_HEADERS } from "./schema";

type Records = { Vacancies: Vacancy; Applications: Application; Stage_History: StageHistoryEntry; Notes: InternalNote; Admin_Users: AdminUser };
type RecordSheet = keyof Records;
type Cell = string | number | boolean;
const nullable = new Set(["open_at", "close_at", "closed_at", "anonymized_at", "from_stage", "from_status", "last_login_at"]);
const numeric = new Set(["quota", "experience_years", "last_salary", "expected_salary", "session_version"]);
const boolean = new Set(["consent", "active"]);
const camel = (name: string) => name.replace(/_([a-z])/g, (_, letter: string) => letter.toUpperCase());

/** Reads rows by header name so column order can change without corrupting data. */
export function rowToRecord<K extends RecordSheet>(sheet: K, headers: readonly string[], row: readonly unknown[]): Records[K] {
  const result: Record<string, unknown> = {};
  for (const header of SHEET_HEADERS[sheet]) {
    const index = headers.indexOf(header);
    if (header === "note_is_public" && index < 0) continue;
    if (index < 0 || headers.indexOf(header, index + 1) >= 0) throw new Error(`Missing or duplicate ${sheet} header: ${header}`);
    const value = row[index] ?? "";
    if (header === "note_is_public") {
      if (value === true || value === "TRUE") result.noteIsPublic = true;
      else if (value !== false && value !== "FALSE" && value !== "") throw new Error(`Invalid boolean in ${sheet}.${header}`);
      continue;
    }
    if (nullable.has(header) && value === "") result[camel(header)] = null;
    else if (numeric.has(header)) {
      if (value === "" || !Number.isSafeInteger(Number(value))) throw new Error(`Invalid number in ${sheet}.${header}`);
      result[camel(header)] = Number(value);
    } else if (boolean.has(header)) {
      if (value !== true && value !== false && value !== "TRUE" && value !== "FALSE") throw new Error(`Invalid boolean in ${sheet}.${header}`);
      result[camel(header)] = value === true || value === "TRUE";
    } else result[camel(header)] = String(value);
  }
  return result as unknown as Records[K];
}

/** Values must be written with valueInputOption RAW, never USER_ENTERED. */
export function recordToRow<K extends RecordSheet>(sheet: K, record: Records[K]): Cell[] {
  const values = record as unknown as Record<string, unknown>;
  return SHEET_HEADERS[sheet].map((header) => {
    const value = values[camel(header)];
    if (value === null || value === undefined) return "";
    if (typeof value === "boolean") return value ? "TRUE" : "FALSE";
    if (typeof value === "string" || typeof value === "number") return value;
    throw new Error(`Invalid value in ${sheet}.${header}`);
  });
}

const settingKeys = ["schema_version", "privacy_version", "vacancy_counter", "history_counter", "note_counter", "company_profile", "wa_templates", "retention_months", "last_purge_at", "last_purge_count"] as const;
export function settingsToRows(settings: Settings): Cell[][] {
  const values = settings as unknown as Record<string, unknown>;
  return settingKeys.map((key) => { const value = values[camel(key)]; return [key, value == null ? "" : typeof value === "object" ? JSON.stringify(value) : value as Cell]; });
}
export function rowsToSettings(rows: readonly (readonly unknown[])[]): Settings {
  const values = new Map<string, unknown>();
  for (const row of rows) { const key = String(row[0] ?? ""); if (values.has(key)) throw new Error(`Duplicate setting: ${key}`); values.set(key, row[1] ?? ""); }
  const result: Record<string, unknown> = {};
  for (const key of settingKeys) {
    if (!values.has(key)) throw new Error(`Missing setting: ${key}`);
    const value = values.get(key);
    if (key === "company_profile" || key === "wa_templates") result[camel(key)] = JSON.parse(String(value));
    else if (key === "last_purge_at") result[camel(key)] = value === "" ? null : String(value);
    else if (key.endsWith("_counter") || key === "retention_months" || key === "last_purge_count") {
      if (key === "last_purge_count" && value === "") result[camel(key)] = null;
      else { if (value === "" || !Number.isSafeInteger(Number(value))) throw new Error(`Invalid setting: ${key}`); result[camel(key)] = Number(value); }
    } else result[camel(key)] = String(value);
  }
  return result as unknown as Settings;
}
