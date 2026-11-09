import { isVacancyPubliclyOpen } from "@/lib/domain/vacancy";
import type { ApplicantRow, Vacancy } from "@/lib/repositories/types";

/** An active applicant this many days in one stage is "waiting too long". */
export const WAITING_DAYS = 10;
/** Applications from the last this many days count as new. */
export const NEW_DAYS = 7;
/** Open vacancies closing within this many days are flagged. */
export const CLOSING_DAYS = 7;

const DAY = 86_400_000;

/** Whole days since the given time, never negative. */
export function daysSince(iso: string, now: Date): number {
  return Math.max(0, Math.floor((now.getTime() - new Date(iso).getTime()) / DAY));
}

export function isWaiting(row: ApplicantRow, now: Date): boolean {
  const { application } = row;
  return (
    application.status === "active" &&
    application.currentStage !== "hired" &&
    daysSince(row.stageSince, now) >= WAITING_DAYS
  );
}

export function isNew(row: ApplicantRow, now: Date): boolean {
  const age = now.getTime() - new Date(row.application.appliedAt).getTime();
  return age >= 0 && age < NEW_DAYS * DAY;
}

/** Quick views on the applicant list, on top of the regular filters. */
export const VIEWS = {
  baru: { label: `Baru (${NEW_DAYS} hari)`, test: isNew },
  menunggu: { label: `Menunggu > ${WAITING_DAYS} hari`, test: isWaiting },
} as const;
export type View = keyof typeof VIEWS;

export function isView(value: unknown): value is View {
  return typeof value === "string" && Object.hasOwn(VIEWS, value);
}

export function applyView(rows: ApplicantRow[], view: unknown, now: Date): ApplicantRow[] {
  if (!isView(view)) return rows;
  const test = VIEWS[view].test;
  return rows.filter((row) => test(row, now));
}

/** Where an applicant sits in a list, for previous/next links. */
export function neighbours(rows: ApplicantRow[], id: string) {
  const index = rows.findIndex((row) => row.application.id === id);
  if (index < 0) return null;
  return {
    position: index + 1,
    total: rows.length,
    previous: rows[index - 1]?.application ?? null,
    next: rows[index + 1]?.application ?? null,
  };
}

/** What needs HR's attention today. */
export function attention(rows: ApplicantRow[], vacancies: Vacancy[], now: Date) {
  const active = rows.filter((row) => row.application.status === "active");
  const oldestFirst = (a: ApplicantRow, b: ApplicantRow) =>
    new Date(a.stageSince).getTime() - new Date(b.stageSince).getTime();
  const open = vacancies.filter((vacancy) => isVacancyPubliclyOpen(vacancy, now));
  const hired = new Map<string, number>();
  for (const row of active) {
    if (row.application.currentStage === "hired") {
      hired.set(row.application.vacancyId, (hired.get(row.application.vacancyId) ?? 0) + 1);
    }
  }
  return {
    unscreened: active
      .filter((row) => row.application.currentStage === "applied")
      .sort(oldestFirst),
    waiting: active
      .filter((row) => row.application.currentStage !== "applied" && isWaiting(row, now))
      .sort(oldestFirst),
    closingSoon: open
      .filter((vacancy) => {
        if (!vacancy.closeAt) return false;
        const left = new Date(vacancy.closeAt).getTime() - now.getTime();
        return left >= 0 && left <= CLOSING_DAYS * DAY;
      })
      .sort((a, b) => new Date(a.closeAt!).getTime() - new Date(b.closeAt!).getTime()),
    quotaFilled: open
      .filter((vacancy) => vacancy.quota > 0 && (hired.get(vacancy.id) ?? 0) >= vacancy.quota)
      .map((vacancy) => ({ vacancy, hired: hired.get(vacancy.id) ?? 0 })),
  };
}
