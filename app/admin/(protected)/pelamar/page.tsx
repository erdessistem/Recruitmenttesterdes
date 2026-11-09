import Link from "next/link";
import { Download } from "lucide-react";
import { repository } from "@/lib/repositories";
import { requireAdmin } from "@/lib/auth/session";
import { listQuery, toRepositoryFilters, type ApplicantFilters } from "@/lib/admin/filters";
import { VIEWS, applyView, daysSince, isNew, isView, isWaiting } from "@/lib/admin/attention";
import { ApplicantFilters as FilterBar } from "@/components/admin/applicant-filters";
import { ApplicantTable } from "@/components/admin/applicant-table";
import { EmptyState } from "@/components/ui/empty-state";
import { buttonClass } from "@/components/ui/button";

export const metadata = { title: "Pelamar" };

const PAGE_SIZE = 25;

export default async function Applicants({
  searchParams,
}: {
  searchParams: Promise<ApplicantFilters>;
}) {
  await requireAdmin();
  const f = await searchParams;
  const now = new Date();
  const { vacancies, rows: base } = await repository.getApplicantList(toRepositoryFilters(f));
  const rows = applyView(base, f.view, now);
  const title = new Map(vacancies.map((v) => [v.id, v.title]));

  const pages = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
  const requested = Number(f.page);
  const page = Number.isSafeInteger(requested) ? Math.max(1, Math.min(requested, pages)) : 1;
  const query = listQuery(f);
  const pageLink = (value: number) => `/admin/pelamar${query ? `${query}&` : "?"}page=${value}`;
  const filtering = Boolean(
    f.q || f.vacancy || f.stage || f.status || f.from || f.to || isView(f.view),
  );

  const tableRows = rows.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE).map((row) => {
    const a = row.application;
    const active = a.status === "active";
    return {
      id: a.id,
      name: a.fullName || a.id,
      vacancy: title.get(a.vacancyId) ?? "—",
      stage: a.currentStage,
      status: a.status,
      appliedAt: a.appliedAt,
      days: active ? daysSince(row.stageSince, now) : null,
      waiting: isWaiting(row, now),
      isNew: isNew(row, now),
    };
  });

  return (
    <div className="mx-auto max-w-7xl">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <h1 className="text-3xl font-bold tracking-tight">Pelamar</h1>
        <a
          href={`/admin/pelamar/export${listQuery({ ...f, view: undefined })}`}
          className={buttonClass("secondary")}
        >
          <Download aria-hidden="true" className="h-4 w-4" />
          Ekspor CSV
        </a>
      </div>

      <FilterBar
        initial={{
          q: f.q ?? "",
          vacancy: f.vacancy ?? "",
          stage: f.stage ?? "",
          status: f.status ?? "",
          from: f.from ?? "",
          to: f.to ?? "",
          view: isView(f.view) ? f.view : "",
        }}
        vacancies={vacancies.map((v) => ({ id: v.id, title: v.title }))}
        views={[
          { value: "", label: "Semua", count: base.length },
          ...Object.entries(VIEWS).map(([value, view]) => ({
            value,
            label: view.label,
            count: base.filter((row) => view.test(row, now)).length,
          })),
        ]}
      />

      <p className="mb-3 mt-4 text-sm text-muted" aria-live="polite">
        {rows.length} pelamar{filtering ? " sesuai filter" : ""}.
        {isView(f.view)
          ? " Ekspor CSV memakai filter di atas, tanpa tampilan cepat."
          : " Ekspor CSV mengikuti filter ini."}
      </p>

      {rows.length === 0 ? (
        <EmptyState
          title={filtering ? "Tidak ada pelamar yang cocok" : "Belum ada pelamar"}
          action={
            filtering ? (
              <Link href="/admin/pelamar" className={buttonClass("secondary")}>
                Hapus filter
              </Link>
            ) : undefined
          }
        >
          {filtering
            ? "Ubah atau hapus filter untuk melihat pelamar lain."
            : "Lamaran yang masuk akan muncul di sini."}
        </EmptyState>
      ) : (
        <ApplicantTable rows={tableRows} query={query} />
      )}

      {pages > 1 && (
        <nav aria-label="Halaman" className="mt-5 flex items-center gap-4 text-sm">
          <span>
            Halaman {page} dari {pages}
          </span>
          {page > 1 && (
            <Link className="font-semibold text-primary hover:underline" href={pageLink(page - 1)}>
              Sebelumnya
            </Link>
          )}
          {page < pages && (
            <Link className="font-semibold text-primary hover:underline" href={pageLink(page + 1)}>
              Berikutnya
            </Link>
          )}
        </nav>
      )}
    </div>
  );
}
