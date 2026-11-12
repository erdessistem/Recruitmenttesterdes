"use client";
import { useEffect, useRef, useState, useTransition } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Search } from "lucide-react";
import {
  APPLICATION_STATUSES,
  APPLICATION_STATUS_LABELS,
  STAGES,
  STAGE_LABELS,
} from "@/lib/constants";
import { cn } from "@/lib/utils";

type Values = {
  q: string;
  vacancy: string;
  stage: string;
  status: string;
  from: string;
  to: string;
  view: string;
};

/** Filters that apply as soon as they change. The URL stays shareable. */
export function ApplicantFilters({
  initial,
  vacancies,
  views,
}: {
  initial: Values;
  vacancies: Array<{ id: string; title: string }>;
  /** Quick views with how many applicants each would show under the other filters. */
  views: Array<{ value: string; label: string; count: number | null }>;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [values, setValues] = useState(initial);
  const [pending, startTransition] = useTransition();
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const lastSent = useRef(JSON.stringify(initial));
  const [seen, setSeen] = useState(JSON.stringify(initial));

  // A link elsewhere on the page changed the filters: show them. Our own updates are skipped.
  const incoming = JSON.stringify(initial);
  if (incoming !== seen) {
    setSeen(incoming);
    if (incoming !== lastSent.current) setValues(initial);
  }

  useEffect(() => () => clearTimeout(timer.current), []);

  function navigate(next: Values) {
    lastSent.current = JSON.stringify(next);
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(next)) if (value) params.set(key, value);
    const text = params.toString();
    startTransition(() =>
      router.replace(text ? `${pathname}?${text}` : pathname, { scroll: false }),
    );
  }

  function update(patch: Partial<Values>, delay = 0) {
    const next = { ...values, ...patch };
    setValues(next);
    clearTimeout(timer.current);
    if (delay) timer.current = setTimeout(() => navigate(next), delay);
    else navigate(next);
  }

  const filtering = Object.values(values).some(Boolean);
  const datesSet = Boolean(values.from || values.to);

  return (
    <div className="mt-6" aria-busy={pending}>
      <div className="flex flex-wrap gap-2" role="group" aria-label="Tampilan cepat">
        {views.map((view) => {
          const active = values.view === view.value;
          return (
            <button
              key={view.value || "all"}
              type="button"
              aria-pressed={active}
              onClick={() => update({ view: active ? "" : view.value })}
              className={cn(
                "inline-flex min-h-10 items-center gap-2 rounded-full border px-4 text-sm font-semibold transition-colors duration-150 motion-reduce:transition-none",
                active
                  ? "border-navy bg-navy text-white"
                  : "border-border bg-surface text-foreground hover:border-border-strong",
              )}
            >
              {view.label}
              {view.count != null && (
                <span
                  className={cn(
                    "tabular rounded-full px-1.5 text-xs",
                    active ? "bg-white/20" : "bg-sand text-navy",
                  )}
                >
                  {view.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      <div className="admin-card mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-[minmax(0,1.4fr)_repeat(3,minmax(0,1fr))]">
        <label className="text-sm font-semibold">
          Pencarian
          <span className="relative mt-2 block">
            <Search
              aria-hidden="true"
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted"
            />
            <input
              type="search"
              className="control pl-9 font-normal"
              value={values.q}
              onChange={(event) => update({ q: event.target.value }, 350)}
              placeholder="Nama, WhatsApp, atau Applicant ID"
            />
          </span>
        </label>
        <label className="text-sm font-semibold">
          Lowongan
          <select
            className="control mt-2 font-normal"
            value={values.vacancy}
            onChange={(event) => update({ vacancy: event.target.value })}
          >
            <option value="">Semua lowongan</option>
            {vacancies.map((v) => (
              <option key={v.id} value={v.id}>
                {v.title}
              </option>
            ))}
          </select>
        </label>
        <label className="text-sm font-semibold">
          Tahap
          <select
            className="control mt-2 font-normal"
            value={values.stage}
            onChange={(event) => update({ stage: event.target.value })}
          >
            <option value="">Semua tahap</option>
            {STAGES.map((s) => (
              <option key={s} value={s}>
                {STAGE_LABELS[s]}
              </option>
            ))}
          </select>
        </label>
        <label className="text-sm font-semibold">
          Status
          <select
            className="control mt-2 font-normal"
            value={values.status}
            onChange={(event) => update({ status: event.target.value })}
          >
            <option value="">Semua status</option>
            {APPLICATION_STATUSES.map((s) => (
              <option key={s} value={s}>
                {APPLICATION_STATUS_LABELS[s]}
              </option>
            ))}
          </select>
        </label>
        <details className="group sm:col-span-2 xl:col-span-4" open={datesSet || undefined}>
          <summary className="cursor-pointer text-sm font-semibold text-primary">
            Tanggal melamar{datesSet ? " (aktif)" : ""}
          </summary>
          <div className="mt-3 grid gap-4 sm:grid-cols-2 xl:max-w-xl">
            <label className="text-sm font-semibold">
              Dari
              <input
                type="date"
                className="control mt-2 font-normal"
                value={values.from}
                onChange={(event) => update({ from: event.target.value })}
              />
            </label>
            <label className="text-sm font-semibold">
              Sampai
              <input
                type="date"
                className="control mt-2 font-normal"
                value={values.to}
                onChange={(event) => update({ to: event.target.value })}
              />
            </label>
          </div>
        </details>
      </div>
      <div className="mt-2 flex min-h-6 items-center justify-end gap-4 text-sm">
        {pending && <span className="text-muted">Memuat…</span>}
        {filtering && (
          <button
            type="button"
            className="font-semibold text-primary hover:underline"
            onClick={() =>
              update({ q: "", vacancy: "", stage: "", status: "", from: "", to: "", view: "" })
            }
          >
            Hapus semua filter
          </button>
        )}
      </div>
    </div>
  );
}
