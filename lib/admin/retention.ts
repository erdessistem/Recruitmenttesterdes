import "server-only";
import { subMonths } from "date-fns";
import type { Application } from "@/lib/repositories/types";
export function isRetentionEligible(application: Application, months: number, now: Date = new Date()): boolean {
  if (!Number.isInteger(months) || months < 0 || !application.closedAt || application.anonymizedAt || !["rejected", "withdrawn"].includes(application.status)) return false;
  const closed = Date.parse(application.closedAt);
  return Number.isFinite(closed) && closed < subMonths(now, months).getTime();
}
