import { APPLICATION_STATUSES, STAGES, type ApplicationStatus, type Stage } from "@/lib/constants";
import { isDateOnlyString, jakartaDateOnlyToUtc } from "@/lib/format/date";
export type ApplicantFilters = {
  q?: string;
  vacancy?: string;
  stage?: string;
  status?: string;
  from?: string;
  to?: string;
  view?: string;
  page?: string;
};
export function toRepositoryFilters(f: ApplicantFilters) {
  return {
    query: f.q,
    vacancyId: f.vacancy || undefined,
    stage: STAGES.includes(f.stage as Stage) ? (f.stage as Stage) : undefined,
    status: APPLICATION_STATUSES.includes(f.status as ApplicationStatus)
      ? (f.status as ApplicationStatus)
      : undefined,
    appliedFrom: f.from && isDateOnlyString(f.from) ? jakartaDateOnlyToUtc(f.from) : undefined,
    appliedTo: f.to && isDateOnlyString(f.to) ? jakartaDateOnlyToUtc(f.to, "end") : undefined,
  };
}

const LIST_KEYS = ["q", "vacancy", "stage", "status", "from", "to", "view"] as const;

/** The list filters as a query string (without the page), so detail pages can return to the same list. */
export function listQuery(f: ApplicantFilters): string {
  const params = new URLSearchParams();
  for (const key of LIST_KEYS) {
    const value = f[key];
    if (typeof value === "string" && value) params.set(key, value);
  }
  const text = params.toString();
  return text ? `?${text}` : "";
}
