/**
 * Normalizes Indonesian WhatsApp numbers to the storage format `62...`.
 * Accepts `08...`, `8...`, `62...`, and `+62...` with common separators.
 */
export function normalizeWhatsApp(value: unknown): string | null {
  if (typeof value !== "string" && typeof value !== "number") return null;

  let digits = String(value).replace(/\D/g, "");
  if (!digits) return null;

  // International access prefix: 0062...
  if (digits.startsWith("00")) {
    digits = digits.slice(2);
  }

  if (digits.startsWith("0")) {
    digits = `62${digits.slice(1)}`;
  } else if (digits.startsWith("8")) {
    digits = `62${digits}`;
  }

  // `62` followed by a non-zero digit, 10–15 digits in total.
  if (!/^62[1-9]\d{7,12}$/.test(digits)) return null;

  return digits;
}

/** Returns true when the value normalizes to a valid Indonesian WhatsApp number. */
export function isValidWhatsApp(value: unknown): boolean {
  return normalizeWhatsApp(value) !== null;
}

/** Formats a normalized number for display, e.g. `+62 812-3456-7890`. */
export function formatWhatsAppDisplay(value: unknown): string {
  const normalized = normalizeWhatsApp(value);
  if (!normalized) return typeof value === "string" ? value : "—";

  const local = normalized.slice(2);
  if (local.startsWith("8") && local.length >= 9) {
    return `+62 ${local.slice(0, 3)}-${local.slice(3, 7)}-${local.slice(7)}`;
  }

  return `+62 ${local}`;
}

/** Builds a click-to-chat link for an already normalized WhatsApp number. */
export function toWhatsAppUrl(value: unknown, message?: string): string | null {
  const normalized = normalizeWhatsApp(value);
  if (!normalized) return null;

  const query = message ? `?text=${encodeURIComponent(message)}` : "";
  return `https://wa.me/${normalized}${query}`;
}
