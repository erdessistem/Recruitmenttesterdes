import "server-only";
import { createHash } from "node:crypto";

const state = globalThis as typeof globalThis & { __trackingRate?: Map<string, number[]> };
const buckets = state.__trackingRate ??= new Map<string, number[]>();
/** Process-local fallback only; limits are not shared between instances. */
export function allowAttempt(scope: string, identity: string, limit: number, windowMs: number, now = Date.now()): boolean {
  const key = `${scope}:${createHash("sha256").update(identity).digest("hex")}`;
  for (const [id, times] of buckets) if (!times.some(time => time > now - 3_600_000)) buckets.delete(id);
  const recent = (buckets.get(key) ?? []).filter(time => time > now - windowMs);
  if (recent.length >= limit) return false;
  recent.push(now); buckets.set(key, recent); return true;
}
