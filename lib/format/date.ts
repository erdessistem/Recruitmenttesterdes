import { formatInTimeZone, fromZonedTime } from "date-fns-tz";
import { id as indonesianLocale } from "date-fns/locale";

import { TIME_ZONE } from "@/lib/constants";

const DATE_ONLY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

type DateInput = Date | string | number | null | undefined;

function toValidDate(value: DateInput): Date | null {
  if (value === null || value === undefined || value === "") return null;

  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

/** Formats a timestamp as `2 November 2026` in Asia/Jakarta. */
export function formatDate(value: DateInput): string {
  const date = toValidDate(value);
  if (!date) return "—";

  return formatInTimeZone(date, TIME_ZONE, "d MMMM yyyy", {
    locale: indonesianLocale,
  });
}

/** Formats a timestamp as `2 November 2026, 14.30 WIB` in Asia/Jakarta. */
export function formatDateTime(value: DateInput): string {
  const date = toValidDate(value);
  if (!date) return "—";

  return formatInTimeZone(date, TIME_ZONE, "d MMMM yyyy, HH.mm 'WIB'", {
    locale: indonesianLocale,
  });
}

/** Formats a timestamp as a Jakarta date-only value (`yyyy-MM-dd`). */
export function formatJakartaDateKey(value: DateInput = new Date()): string {
  const date = toValidDate(value);
  if (!date) return "";

  return formatInTimeZone(date, TIME_ZONE, "yyyy-MM-dd");
}

/** Formats a timestamp using a custom date-fns pattern in Asia/Jakarta. */
export function formatInJakarta(
  value: DateInput,
  pattern: string,
  options?: { locale?: typeof indonesianLocale },
): string {
  const date = toValidDate(value);
  if (!date) return "—";

  return formatInTimeZone(date, TIME_ZONE, pattern, {
    locale: options?.locale ?? indonesianLocale,
  });
}

/**
 * Converts an admin date-only input to UTC.
 * Start dates use 00:00 Jakarta; close dates use 23:59:59.999 Jakarta (inclusive).
 */
export function jakartaDateOnlyToUtc(
  dateOnly: string,
  edge: "start" | "end" = "start",
): string {
  if (!isDateOnlyString(dateOnly)) {
    throw new Error(`Tanggal tidak valid: ${dateOnly}`);
  }

  const time = edge === "end" ? "23:59:59.999" : "00:00:00.000";
  return fromZonedTime(`${dateOnly}T${time}`, TIME_ZONE).toISOString();
}

/** Returns the inclusive UTC start/end of the Jakarta month containing `reference`. */
export function getJakartaMonthRangeUtc(reference: Date = new Date()): {
  start: string;
  end: string;
} {
  const [year, month] = formatJakartaDateKey(reference).split("-").map(Number);

  const nextYear = month === 12 ? year + 1 : year;
  const nextMonth = month === 12 ? 1 : month + 1;
  const nextMonthKey = `${nextYear}-${String(nextMonth).padStart(2, "0")}-01`;

  const start = jakartaDateOnlyToUtc(
    `${year}-${String(month).padStart(2, "0")}-01`,
    "start",
  );
  const nextStart = jakartaDateOnlyToUtc(nextMonthKey, "start");
  const end = new Date(new Date(nextStart).getTime() - 1).toISOString();

  return { start, end };
}

export function isDateOnlyString(value: string): boolean {
  if (!DATE_ONLY_PATTERN.test(value)) return false;
  const date = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}
