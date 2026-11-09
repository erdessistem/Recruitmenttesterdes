"use client";
import Link from "next/link";
import { useMemo, useState } from "react";
import { CalendarDays, ChevronRight, MapPin, Search, Wallet } from "lucide-react";
import { EMPLOYMENT_TYPE_LABELS, type EmploymentType } from "@/lib/constants";
import { formatDate } from "@/lib/format/date";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { buttonClass } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type VacancyListItem = {
  id: string;
  slug: string;
  title: string;
  department: string;
  location: string;
  employmentType: EmploymentType;
  closeAt: string | null;
  /** Formatted salary range, only when the vacancy shows it to candidates. */
  salary: string | null;
};
type Filters = { q: string; department: string; location: string; type: string };
type FilterKey = Exclude<keyof Filters, "q">;

const DAY = 86_400_000;
const unique = (values: string[]) => [...new Set(values)].sort((a, b) => a.localeCompare(b, "id"));

function queryString(filters: Filters) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(filters)) if (value) params.set(key, value);
  const text = params.toString();
  return text ? `/?${text}#lowongan` : "/#lowongan";
}

/**
 * Filters instantly in the browser (the list is small). Chips are real links,
 * so filtering still works without JavaScript, and the URL stays shareable.
 */
export function VacancyBrowser({
  vacancies,
  initial,
  now,
}: {
  vacancies: VacancyListItem[];
  initial: Filters;
  now: number;
}) {
  const [filters, setFilters] = useState<Filters>(initial);
  const groups: { key: FilterKey; label: string; options: { value: string; label: string }[] }[] = [
    {
      key: "department",
      label: "Departemen",
      options: unique(vacancies.map((v) => v.department)).map((v) => ({ value: v, label: v })),
    },
    {
      key: "location",
      label: "Lokasi",
      options: unique(vacancies.map((v) => v.location)).map((v) => ({ value: v, label: v })),
    },
    {
      key: "type",
      label: "Jenis",
      options: unique(vacancies.map((v) => v.employmentType)).map((v) => ({
        value: v,
        label: EMPLOYMENT_TYPE_LABELS[v as EmploymentType],
      })),
    },
  ];
  const filtered = useMemo(
    () =>
      vacancies.filter(
        (v) =>
          (!filters.q ||
            `${v.title} ${v.department} ${v.location}`
              .toLowerCase()
              .includes(filters.q.toLowerCase().trim())) &&
          (!filters.department || v.department === filters.department) &&
          (!filters.location || v.location === filters.location) &&
          (!filters.type || v.employmentType === filters.type),
      ),
    [vacancies, filters],
  );
  const filtering = Boolean(filters.q || filters.department || filters.location || filters.type);

  function update(next: Filters) {
    setFilters(next);
    window.history.replaceState(null, "", queryString(next));
  }

  return (
    <>
      <form
        role="search"
        action="/#lowongan"
        className="mt-6"
        onSubmit={(event) => event.preventDefault()}
      >
        <label className="sr-only" htmlFor="q">
          Cari lowongan
        </label>
        <div className="relative max-w-xl">
          <Search
            aria-hidden="true"
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted"
          />
          <input
            className="control pl-9"
            id="q"
            name="q"
            type="search"
            value={filters.q}
            onChange={(event) => update({ ...filters, q: event.target.value })}
            placeholder="Cari posisi atau lokasi"
            autoComplete="off"
          />
        </div>
        {/* Carry the chip filters along if the form is submitted without JavaScript. */}
        {(["department", "location", "type"] as const).map(
          (key) =>
            filters[key] && <input key={key} type="hidden" name={key} value={filters[key]} />,
        )}
      </form>

      <div className="mt-4 space-y-3">
        {groups
          .filter((group) => group.options.length > 1)
          .map((group) => (
            <div key={group.key} className="flex flex-wrap items-center gap-2">
              <span className="w-24 shrink-0 text-sm text-muted">{group.label}</span>
              {[{ value: "", label: "Semua" }, ...group.options].map((option) => {
                const active = filters[group.key] === option.value;
                const next = { ...filters, [group.key]: option.value };
                return (
                  <a
                    key={option.value || "all"}
                    href={queryString(next)}
                    aria-current={active ? "true" : undefined}
                    onClick={(event) => {
                      event.preventDefault();
                      update(next);
                    }}
                    className={cn(
                      "inline-flex min-h-9 items-center rounded-full border px-3.5 text-sm font-medium transition-colors motion-reduce:transition-none",
                      active
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border bg-surface hover:border-border-strong",
                    )}
                  >
                    {option.label}
                  </a>
                );
              })}
            </div>
          ))}
      </div>

      <div className="mb-3 mt-8 flex items-center justify-between gap-4 text-sm text-muted">
        <p aria-live="polite">{filtered.length} lowongan</p>
        {filtering && (
          <button
            type="button"
            onClick={() => update({ q: "", department: "", location: "", type: "" })}
            className="font-semibold text-primary hover:underline"
          >
            Hapus filter
          </button>
        )}
      </div>

      {filtered.length > 0 ? (
        <ul className="divide-y divide-border overflow-hidden rounded-panel border border-border bg-surface">
          {filtered.map((v) => {
            const closeTime = v.closeAt ? new Date(v.closeAt).getTime() : null;
            const closesSoon =
              closeTime != null && closeTime - now >= 0 && closeTime - now <= 7 * DAY;
            return (
              <li key={v.id} className="group relative transition-colors hover:bg-paper">
                <div className="flex items-center gap-4 px-5 py-5 sm:px-6">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                      <h3 className="text-lg font-semibold">
                        <Link href={`/lowongan/${v.slug}`} className="after:absolute after:inset-0">
                          {v.title}
                        </Link>
                      </h3>
                      <Badge tone="rel">{EMPLOYMENT_TYPE_LABELS[v.employmentType]}</Badge>
                      {closesSoon && <Badge tone="sinyal">Segera ditutup</Badge>}
                    </div>
                    <div className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-sm text-muted">
                      <span>{v.department}</span>
                      <span className="inline-flex items-center gap-1.5">
                        <MapPin aria-hidden="true" className="h-4 w-4" />
                        {v.location}
                      </span>
                      {v.salary && (
                        <span className="inline-flex items-center gap-1.5">
                          <Wallet aria-hidden="true" className="h-4 w-4" />
                          {v.salary}
                        </span>
                      )}
                      <span className="inline-flex items-center gap-1.5">
                        <CalendarDays aria-hidden="true" className="h-4 w-4" />
                        {v.closeAt ? `Ditutup ${formatDate(v.closeAt)}` : "Tanpa batas waktu"}
                      </span>
                    </div>
                  </div>
                  <ChevronRight
                    aria-hidden="true"
                    className="h-5 w-5 shrink-0 text-muted transition-transform duration-150 ease-out motion-reduce:transition-none [@media(hover:hover)]:group-hover:translate-x-0.5"
                  />
                </div>
              </li>
            );
          })}
        </ul>
      ) : filtering ? (
        <EmptyState
          title="Tidak ada lowongan yang cocok"
          action={
            <button
              type="button"
              className={buttonClass("secondary")}
              onClick={() => update({ q: "", department: "", location: "", type: "" })}
            >
              Hapus filter
            </button>
          }
        >
          Coba kata kunci lain atau hapus beberapa filter.
        </EmptyState>
      ) : (
        <EmptyState title="Belum ada lowongan terbuka">
          Lowongan baru akan tampil di halaman ini. Jika sudah melamar, Anda tetap dapat{" "}
          <Link href="/lacak" className="font-semibold text-primary underline">
            melacak lamaran
          </Link>
          .
        </EmptyState>
      )}
    </>
  );
}
