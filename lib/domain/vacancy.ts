import type { Vacancy } from "@/lib/repositories/types";

/**
 * A vacancy is publicly visible only when it is `open` and the current instant
 * falls within the optional open/close window. The close timestamp is inclusive;
 * admin date-only inputs are converted to 23:59:59.999 Asia/Jakarta.
 */
export function isVacancyPubliclyOpen(
  vacancy: Pick<Vacancy, "status" | "openAt" | "closeAt">,
  now: Date = new Date(),
): boolean {
  if (vacancy.status !== "open") return false;

  const current = now.getTime();

  if (vacancy.openAt && current < new Date(vacancy.openAt).getTime()) {
    return false;
  }

  if (vacancy.closeAt && current > new Date(vacancy.closeAt).getTime()) {
    return false;
  }

  return true;
}

/** Returns true when the vacancy has a close date that has already passed. */
export function isPastCloseDate(
  vacancy: Pick<Vacancy, "closeAt">,
  now: Date = new Date(),
): boolean {
  return Boolean(vacancy.closeAt && now.getTime() > new Date(vacancy.closeAt).getTime());
}
