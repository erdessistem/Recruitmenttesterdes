import Link from "next/link";
import { repository } from "@/lib/repositories";
import {
  EMPLOYMENT_TYPE_LABELS,
  VACANCY_STATUSES,
  VACANCY_STATUS_LABELS,
  type VacancyStatus,
} from "@/lib/constants";
import { formatDate } from "@/lib/format/date";
import { changeVacancyStatus } from "./actions";
import { requireAdmin } from "@/lib/auth/session";
import { canEdit } from "@/lib/auth/roles";
import { Plus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { buttonClass } from "@/components/ui/button";
export const metadata = { title: "Lowongan" };
export default async function Vacancies({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; department?: string }>;
}) {
  const admin = await requireAdmin();
  const editor = canEdit(admin.role);
  const filters = await searchParams;
  const [all, apps] = await Promise.all([repository.getVacancies(), repository.getApplications()]);
  const vacancies = all.filter(
    (v) =>
      (!filters.status || v.status === filters.status) &&
      (!filters.department || v.department === filters.department),
  );
  return (
    <div className="mx-auto max-w-7xl">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <h1 className="text-3xl font-bold tracking-tight">Lowongan</h1>
        {editor && (
          <Link href="/admin/lowongan/baru" className={buttonClass("primary")}>
            <Plus aria-hidden="true" className="h-4 w-4" />
            Buat lowongan
          </Link>
        )}
      </div>
      <form className="admin-card mt-6 flex flex-wrap items-end gap-3">
        <label className="text-sm font-semibold">
          Status
          <select className="control mt-2" name="status" defaultValue={filters.status ?? ""}>
            <option value="">Semua status</option>
            {VACANCY_STATUSES.map((s) => (
              <option key={s} value={s}>
                {VACANCY_STATUS_LABELS[s]}
              </option>
            ))}
          </select>
        </label>
        <label className="text-sm font-semibold">
          Departemen
          <select
            className="control mt-2"
            name="department"
            defaultValue={filters.department ?? ""}
          >
            <option value="">Semua departemen</option>
            {[...new Set(all.map((v) => v.department))].sort().map((d) => (
              <option key={d}>{d}</option>
            ))}
          </select>
        </label>
        <button className={buttonClass("secondary")}>Terapkan</button>
      </form>
      <div className="admin-card mt-5 overflow-x-auto p-0">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Lowongan</th>
              <th>Departemen / lokasi</th>
              <th>Jenis</th>
              <th>Status</th>
              <th>Pelamar</th>
              <th>Ditutup</th>
              {editor && <th>Tindakan</th>}
            </tr>
          </thead>
          <tbody>
            {vacancies.map((v) => (
              <tr key={v.id}>
                <td>
                  <Link
                    className="font-semibold text-primary hover:underline"
                    href={
                      editor
                        ? `/admin/lowongan/${v.id}`
                        : `/admin/pelamar?vacancy=${encodeURIComponent(v.id)}`
                    }
                  >
                    {v.title}
                  </Link>
                </td>
                <td>
                  {v.department}
                  <br />
                  {v.location}
                </td>
                <td>{EMPLOYMENT_TYPE_LABELS[v.employmentType]}</td>
                <td>
                  <Badge
                    tone={v.status === "open" ? "rel" : v.status === "draft" ? "sinyal" : "neutral"}
                  >
                    {VACANCY_STATUS_LABELS[v.status]}
                  </Badge>
                </td>
                <td className="tabular">
                  <Link
                    className="hover:underline"
                    href={`/admin/pelamar?vacancy=${encodeURIComponent(v.id)}`}
                  >
                    {apps.filter((a) => a.vacancyId === v.id).length}
                  </Link>
                </td>
                <td className="tabular text-muted">{v.closeAt ? formatDate(v.closeAt) : "—"}</td>
                {editor && (
                  <td>
                    <form action={changeVacancyStatus} className="flex gap-2">
                      <input type="hidden" name="id" value={v.id} />
                      <select
                        name="status"
                        aria-label={`Status ${v.title}`}
                        defaultValue={v.status}
                        className="control min-h-9 w-auto py-1.5"
                      >
                        {VACANCY_STATUSES.map((s: VacancyStatus) => (
                          <option key={s} value={s}>
                            {VACANCY_STATUS_LABELS[s]}
                          </option>
                        ))}
                      </select>
                      <button className={buttonClass("ghost", "min-h-9 text-primary")}>
                        Simpan
                      </button>
                    </form>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
        {!vacancies.length && (
          <EmptyState className="m-6" title="Tidak ada lowongan yang cocok">
            Ubah filter, atau buat lowongan baru.
          </EmptyState>
        )}
      </div>
    </div>
  );
}
