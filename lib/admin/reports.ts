import { APPLICATION_SOURCES, STAGES, type ApplicationSource, type Stage } from "@/lib/constants";
import { formatJakartaDateKey, jakartaDateOnlyToUtc } from "@/lib/format/date";
import type { Application, StageHistoryEntry, Vacancy } from "@/lib/repositories/types";

export const PERIODS = {
  "30": "30 hari",
  "90": "90 hari",
  tahun: "Tahun ini",
  semua: "Semua waktu",
} as const;
export type Period = keyof typeof PERIODS;

export function isPeriod(value: unknown): value is Period {
  return typeof value === "string" && Object.hasOwn(PERIODS, value);
}

const DAY = 86_400_000;
const INTERVIEW = STAGES.indexOf("hr_interview");

/** The earliest application date the period includes, or null for all time. */
export function periodStart(period: Period, now: Date): Date | null {
  if (period === "semua") return null;
  if (period === "tahun") {
    const year = formatJakartaDateKey(now).slice(0, 4);
    return new Date(jakartaDateOnlyToUtc(`${year}-01-01`));
  }
  return new Date(now.getTime() - Number(period) * DAY);
}

function average(values: number[]): number | null {
  return values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : null;
}

/** Each application's history in order. */
function historyById(history: StageHistoryEntry[]) {
  const map = new Map<string, StageHistoryEntry[]>();
  for (const entry of history) {
    const list = map.get(entry.applicationId) ?? [];
    list.push(entry);
    map.set(entry.applicationId, list);
  }
  for (const list of map.values()) {
    list.sort(
      (a, b) =>
        new Date(a.changedAt).getTime() - new Date(b.changedAt).getTime() ||
        a.id.localeCompare(b.id),
    );
  }
  return map;
}

/** The furthest stage an application ever reached, even if it later moved back or closed. */
function furthest(application: Application, events: StageHistoryEntry[]): number {
  return Math.max(
    STAGES.indexOf(application.currentStage),
    ...events.map((event) => STAGES.indexOf(event.toStage)),
  );
}

const isHired = (a: Application) => a.status === "active" && a.currentStage === "hired";

export function buildReport(
  data: { vacancies: Vacancy[]; applications: Application[]; history: StageHistoryEntry[] },
  options: { period: Period; vacancyId?: string },
  now: Date,
) {
  const start = periodStart(options.period, now);
  const applications = data.applications.filter(
    (a) =>
      (!start || new Date(a.appliedAt).getTime() >= start.getTime()) &&
      (!options.vacancyId || a.vacancyId === options.vacancyId),
  );
  const events = historyById(data.history);
  const reach = new Map(applications.map((a) => [a.id, furthest(a, events.get(a.id) ?? [])]));

  const totals = {
    total: applications.length,
    inProcess: applications.filter((a) => a.status === "active" && a.currentStage !== "hired")
      .length,
    hired: applications.filter(isHired).length,
    rejected: applications.filter((a) => a.status === "rejected").length,
    withdrawn: applications.filter((a) => a.status === "withdrawn").length,
  };

  const sources = APPLICATION_SOURCES.map((source: ApplicationSource) => {
    const list = applications.filter((a) => a.source === source);
    return {
      source,
      count: list.length,
      interview: list.filter((a) => (reach.get(a.id) ?? 0) >= INTERVIEW).length,
      hired: list.filter(isHired).length,
    };
  })
    .filter((row) => row.count > 0)
    .sort((a, b) => b.count - a.count);

  const funnelFor = (list: Application[]) =>
    STAGES.map((stage, index) => ({
      stage,
      count: list.filter((a) => (reach.get(a.id) ?? 0) >= index).length,
    }));
  const funnel = funnelFor(applications);
  const byVacancy = data.vacancies
    .map((vacancy) => {
      const list = applications.filter((a) => a.vacancyId === vacancy.id);
      return { vacancy, total: list.length, funnel: funnelFor(list) };
    })
    .filter((row) => row.total > 0)
    .sort((a, b) => b.total - a.total);

  // Time spent in a stage: from entering it until the next change. Open stays are not counted.
  const spent = new Map<Stage, number[]>(STAGES.map((stage) => [stage, []]));
  const hireDays: number[] = [];
  for (const application of applications) {
    const list = events.get(application.id) ?? [];
    list.forEach((event, index) => {
      const next = list[index + 1];
      if (next && event.toStatus === "active") {
        spent
          .get(event.toStage)!
          .push((new Date(next.changedAt).getTime() - new Date(event.changedAt).getTime()) / DAY);
      }
    });
    if (isHired(application)) {
      const hiredAt = list.find((event) => event.toStage === "hired")?.changedAt;
      if (hiredAt) {
        hireDays.push(
          (new Date(hiredAt).getTime() - new Date(application.appliedAt).getTime()) / DAY,
        );
      }
    }
  }
  const durations = STAGES.filter((stage) => stage !== "hired").map((stage) => ({
    stage,
    days: average(spent.get(stage)!),
    samples: spent.get(stage)!.length,
  }));

  return {
    totals,
    sources,
    funnel,
    byVacancy,
    durations,
    timeToHire: { days: average(hireDays), samples: hireDays.length },
  };
}

export type Report = ReturnType<typeof buildReport>;
