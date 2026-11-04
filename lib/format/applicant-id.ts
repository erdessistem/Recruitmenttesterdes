import { toAsciiAlphanumeric } from "@/lib/format/text";

export const UNIQUE_CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
export const UNIQUE_CODE_LENGTH = 6;
export const MAX_POSITION_CODE_LENGTH = 24;
export const MAX_NAME_COMPACT_LENGTH = 32;
export const FALLBACK_POSITION_CODE = "Posisi";
export const FALLBACK_NAME_COMPACT = "Kandidat";

/**
 * Sanitizes a position code: removes diacritics, spaces, and punctuation while
 * preserving ASCII letters/numbers and capitalization. Falls back to `Posisi`.
 * Length is validated by the vacancy schema; callers generating IDs may truncate.
 */
export function sanitizePositionCode(value: string): string {
  return toAsciiAlphanumeric(value) || FALLBACK_POSITION_CODE;
}

/** Compacts a full name into the Applicant ID segment (maximum 32 characters). */
export function compactFullName(value: string): string {
  const compact = toAsciiAlphanumeric(value).slice(0, MAX_NAME_COMPACT_LENGTH);
  return compact || FALLBACK_NAME_COMPACT;
}

/** Builds a canonical Applicant ID, e.g. `Admin-BudiSantoso-7K3Q9M`. */
export function formatApplicantId(
  positionCode: string,
  fullName: string,
  uniqueCode: string,
): string {
  const position = sanitizePositionCode(positionCode).slice(0, MAX_POSITION_CODE_LENGTH);
  return `${position || FALLBACK_POSITION_CODE}-${compactFullName(fullName)}-${uniqueCode.toUpperCase()}`;
}

/**
 * Normalizes an Applicant ID for comparison only.
 * Case-insensitive; surrounding whitespace, internal spaces, and hyphens are removed.
 */
export function normalizeApplicantIdForLookup(value: string): string {
  return value.replace(/[\s-]+/g, "").toUpperCase();
}

/** Compares a canonical Applicant ID against user input using lookup rules. */
export function matchesApplicantId(canonicalId: string, input: string): boolean {
  if (!canonicalId || !input) return false;
  return normalizeApplicantIdForLookup(canonicalId) === normalizeApplicantIdForLookup(input);
}

/** True when a string is a properly shaped 6-character unique code. */
export function isValidUniqueCode(value: string): boolean {
  return new RegExp(`^[${UNIQUE_CODE_ALPHABET}]{${UNIQUE_CODE_LENGTH}}$`).test(value);
}
