/**
 * Salary values are stored as integer IDR. Input may contain the `Rp` prefix,
 * Indonesian or English thousand separators, and the trailing `,-` convention.
 */
export function parseRupiahInput(value: unknown): number | null {
  if (typeof value === "number") {
    return Number.isSafeInteger(value) ? value : null;
  }

  if (typeof value !== "string") return null;

  const cleaned = value
    .trim()
    .replace(/^rp\.?\s*/i, "")
    .replace(/,-$/, "")
    .replace(/[\s.,]/g, "");

  if (!/^\d+$/.test(cleaned)) return null;

  const parsed = Number(cleaned);
  return Number.isSafeInteger(parsed) ? parsed : null;
}

/** Formats an integer IDR amount as `Rp8.500.000`. */
export function formatRupiah(value: number): string {
  if (!Number.isFinite(value)) return "Rp0";

  const amount = Math.trunc(Math.abs(value));
  const formatted = new Intl.NumberFormat("id-ID", {
    maximumFractionDigits: 0,
  }).format(amount);

  return value < 0 ? `-Rp${formatted}` : `Rp${formatted}`;
}

/** Formats a value for a currency input. Empty/invalid values become an empty string. */
export function formatRupiahInput(value: unknown): string {
  if (value === null || value === undefined || value === "") return "";

  const parsed = parseRupiahInput(value);
  return parsed === null ? "" : formatRupiah(parsed);
}
