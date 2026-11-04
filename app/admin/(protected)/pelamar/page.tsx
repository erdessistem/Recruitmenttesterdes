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
  const exportParams = new URLSearchParams();
  for (const [key, value] of Object.entries(f))
    if (value && key !== "page") exportParams.set(key, value);
  return (
    <div className="mx-auto max-w-7xl">
      <p className="text-sm font-semibold uppercase tracking-widest text-primary">
        Manajemen rekrutmen
      </p>
      <h1 className="mt-2 text-3xl font-bold">Pelamar</h1>
      <form className="admin-card mt-7 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
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
        <div className="flex gap-3">
          <button className="action-button">Terapkan filter</button>
          <Link href="/admin/pelamar" className="action-button">
            Reset
          </Link>
        </div>
      </form>
      <div className="my-5 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted">{apps.length} pelamar ditemukan</p>
        <a href={`/admin/pelamar/export?${exportParams}`} className="action-button">
          Ekspor CSV hasil filter
        </a>
      </div>
      <div className="admin-card overflow-x-auto">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Nama</th>
              <th>Lowongan</th>
              <th>Tahap</th>
              <th>Status</th>
              <th>Tanggal</th>
              <th>WhatsApp</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {apps.slice((page - 1) * size, page * size).map((a) => (
              <tr key={a.id}>
                <td>
                  <span className="font-semibold">{a.fullName || a.id}</span>
                  {Date.now() - new Date(a.appliedAt).getTime() >= 0 &&
                    Date.now() - new Date(a.appliedAt).getTime() < 7 * 86400000 && (
                      <span className="ml-2 rounded-full bg-blue-50 px-2 py-1 text-xs text-primary">
                        Baru
                      </span>
                    )}
                  <br />
                  <span className="text-xs text-muted">{a.id}</span>
                </td>
                <td>{title.get(a.vacancyId) ?? "—"}</td>
                <td>{STAGE_LABELS[a.currentStage]}</td>
                <td>{APPLICATION_STATUS_LABELS[a.status]}</td>
                <td>{formatDate(a.appliedAt)}</td>
                <td>{a.whatsapp || "—"}</td>
                <td>
                  <Link
                    className="font-semibold text-primary"
                    href={`/admin/pelamar/${encodeURIComponent(a.id)}`}
                  >
                    Detail →
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!apps.length && <p className="py-6 text-sm text-muted">Tidak ada pelamar yang sesuai.</p>}
      </div>
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
