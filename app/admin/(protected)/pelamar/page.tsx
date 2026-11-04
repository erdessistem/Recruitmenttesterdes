import Link from "next/link";
import { repository } from "@/lib/repositories";
import {
  APPLICATION_STATUSES,
  APPLICATION_STATUS_LABELS,
  STAGES,
  STAGE_LABELS,
  type ApplicationStatus,
  type Stage,
} from "@/lib/constants";
import { formatDate } from "@/lib/format/date";
import { toRepositoryFilters, type ApplicantFilters } from "@/lib/admin/filters";
import { requireAdmin } from "@/lib/auth/session";
import { Download } from "lucide-react";
import { StageMeter } from "@/components/ui/stage-line";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { buttonClass } from "@/components/ui/button";
export const metadata = { title: "Pelamar" };
type Filters = ApplicantFilters;
export default async function Applicants({ searchParams }: { searchParams: Promise<Filters> }) {
  await requireAdmin();
  const f = await searchParams;
  const [vacancies, apps] = await Promise.all([
    repository.getVacancies(),
    repository.getApplications(toRepositoryFilters(f)),
  ]);
  const title = new Map(vacancies.map((v) => [v.id, v.title]));
  const size = 20,
    pages = Math.max(1, Math.ceil(apps.length / size));
  const requestedPage = Number(f.page);
  const page = Number.isSafeInteger(requestedPage)
    ? Math.max(1, Math.min(requestedPage, pages))
    : 1;
  const pageLink = (value: number) => {
    const params = new URLSearchParams();
    for (const [key, v] of Object.entries(f)) if (v && key !== "page") params.set(key, v);
    params.set("page", String(value));
    return `/admin/pelamar?${params}`;
  };
  const filtering = Boolean(f.q || f.vacancy || f.stage || f.status || f.from || f.to);
  const exportParams = new URLSearchParams();
  for (const [key, value] of Object.entries(f))
    if (value && key !== "page") exportParams.set(key, value);
  return (
    <div className="mx-auto max-w-7xl">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <h1 className="text-3xl font-bold tracking-tight">Pelamar</h1>
        <a href={`/admin/pelamar/export?${exportParams}`} className={buttonClass("secondary")}>
          <Download aria-hidden="true" className="h-4 w-4" />
          Ekspor CSV
        </a>
      </div>
      <form className="admin-card mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <label className="text-sm font-semibold">
          Pencarian
          <input
            className="control mt-2 font-normal"
            name="q"
            defaultValue={f.q}
            placeholder="Nama, WhatsApp, atau Applicant ID"
          />
        </label>
        <label className="text-sm font-semibold">
          Lowongan
          <select
            className="control mt-2 font-normal"
            name="vacancy"
            defaultValue={f.vacancy ?? ""}
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
          <select className="control mt-2 font-normal" name="stage" defaultValue={f.stage ?? ""}>
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
          <select className="control mt-2 font-normal" name="status" defaultValue={f.status ?? ""}>
            <option value="">Semua status</option>
            {APPLICATION_STATUSES.map((s) => (
              <option key={s} value={s}>
                {APPLICATION_STATUS_LABELS[s]}
              </option>
            ))}
          </select>
        </label>
        <label className="text-sm font-semibold">
          Tanggal dari
          <input
            type="date"
            name="from"
            defaultValue={f.from}
            className="control mt-2 font-normal"
          />
        </label>
        <label className="text-sm font-semibold">
          Tanggal sampai
          <input type="date" name="to" defaultValue={f.to} className="control mt-2 font-normal" />
        </label>
        <div className="flex items-end gap-3">
          <button className={buttonClass("primary")}>Terapkan filter</button>
          {filtering && (
            <Link href="/admin/pelamar" className={buttonClass("ghost")}>
              Hapus filter
            </Link>
          )}
        </div>
      </form>
      <p className="mb-3 mt-6 text-sm text-muted" aria-live="polite">
        {apps.length} pelamar{filtering ? " sesuai filter" : ""}. Ekspor CSV mengikuti filter ini.
      </p>
      {apps.length === 0 ? (
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
        <div className="admin-card overflow-x-auto p-0">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Nama</th>
                <th>Lowongan</th>
                <th>Tahap</th>
                <th>Status</th>
                <th>Tanggal</th>
                <th className="hidden xl:table-cell">WhatsApp</th>
              </tr>
            </thead>
            <tbody>
              {apps.slice((page - 1) * size, page * size).map((a) => (
                <tr key={a.id}>
                  <td>
                    <Link
                      className="font-semibold text-primary hover:underline"
                      href={`/admin/pelamar/${encodeURIComponent(a.id)}`}
                    >
                      {a.fullName || a.id}
                    </Link>
                    {Date.now() - new Date(a.appliedAt).getTime() >= 0 &&
                      Date.now() - new Date(a.appliedAt).getTime() < 7 * 86400000 && (
                        <Badge tone="sinyal" className="ml-2">
                          Baru
                        </Badge>
                      )}
                    <br />
                    <span className="tabular text-xs text-muted">{a.id}</span>
                  </td>
                  <td>{title.get(a.vacancyId) ?? "—"}</td>
                  <td>
                    <span className="inline-flex items-center gap-2">
                      <StageMeter currentStage={a.currentStage} status={a.status} />
                      {STAGE_LABELS[a.currentStage]}
                    </span>
                  </td>
                  <td>
                    <Badge
                      tone={
                        a.status === "active"
                          ? "rel"
                          : a.status === "rejected"
                            ? "danger"
                            : "neutral"
                      }
                    >
                      {APPLICATION_STATUS_LABELS[a.status]}
                    </Badge>
                  </td>
                  <td className="tabular text-muted">{formatDate(a.appliedAt)}</td>
                  <td className="tabular hidden xl:table-cell">{a.whatsapp || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <div className="mt-5 flex items-center gap-4 text-sm">
        <span>
          Halaman {page} dari {pages}
        </span>
        {page > 1 && (
          <Link className="text-primary underline" href={pageLink(page - 1)}>
            Sebelumnya
          </Link>
        )}
        {page < pages && (
          <Link className="text-primary underline" href={pageLink(page + 1)}>
            Berikutnya
          </Link>
        )}
      </div>
    </div>
  );
}
