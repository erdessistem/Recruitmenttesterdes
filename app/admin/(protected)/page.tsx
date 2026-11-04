import Link from "next/link";
import { repository } from "@/lib/repositories";
import { APPLICATION_STATUS_LABELS, STAGE_LABELS, STAGES } from "@/lib/constants";
import { formatDate } from "@/lib/format/date";
import { requireAdmin } from "@/lib/auth/session";
export default async function Dashboard() {
  await requireAdmin();
  await repository.reconcileAllApplicationStages();
  const [stats, vacancies] = await Promise.all([
    repository.getDashboardStats(),
    repository.getVacancies(),
  ]);
  const title = new Map(vacancies.map((v) => [v.id, v.title]));
  const cards = [
    ["Lowongan aktif", stats.activeVacancies],
    ["Total pelamar", stats.totalApplicants],
    ["Pelamar bulan ini", stats.applicantsThisMonth],
    ["Pelamar baru 7 hari", stats.newApplicantsLast7Days],
  ] as const;
  const max = Math.max(1, ...Object.values(stats.stageCounts));
  return (
    <div className="mx-auto max-w-7xl">
      <p className="text-sm font-semibold uppercase tracking-widest text-primary">
        Ringkasan rekrutmen
      </p>
      <h1 className="mt-2 text-3xl font-bold">Dashboard</h1>
      <div className="mt-7 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map(([label, count]) => (
          <div key={label} className="admin-card">
            <p className="text-sm text-muted">{label}</p>
            <p className="mt-3 text-3xl font-bold">{count}</p>
          </div>
        ))}
      </div>
      <div className="mt-6 grid gap-6 xl:grid-cols-2">
        <section className="admin-card">
          <h2 className="text-lg font-bold">Distribusi tahap saat ini</h2>
          <div className="mt-5 space-y-4">
            {STAGES.map((stage) => (
              <div key={stage}>
                <div className="flex justify-between text-sm">
                  <span>{STAGE_LABELS[stage]}</span>
                  <strong>{stats.stageCounts[stage]}</strong>
                </div>
                <div className="mt-2 h-2 rounded-full bg-slate-100">
                  <div
                    className="h-full rounded-full bg-primary"
                    style={{ width: `${(stats.stageCounts[stage] / max) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
          <div className="mt-6 flex gap-6 text-sm">
            <span>
              Ditolak: <strong>{stats.rejectedCount}</strong>
            </span>
            <span>
              Mengundurkan diri: <strong>{stats.withdrawnCount}</strong>
            </span>
          </div>
        </section>
        <section className="admin-card">
          <h2 className="text-lg font-bold">Pelamar per lowongan</h2>
          <ul className="mt-4 divide-y divide-border">
            {stats.applicantsPerVacancy.map((v) => (
              <li key={v.vacancyId} className="flex justify-between gap-4 py-3 text-sm">
                <span>{v.title}</span>
                <strong>{v.count}</strong>
              </li>
            ))}
          </ul>
        </section>
      </div>
      <section className="admin-card mt-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-bold">Lamaran terbaru</h2>
          <Link href="/admin/pelamar" className="text-sm font-semibold text-primary">
            Semua pelamar →
          </Link>
        </div>
        <div className="mt-4 overflow-x-auto">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Nama</th>
                <th>Lowongan</th>
                <th>Tahap</th>
                <th>Status</th>
                <th>Tanggal</th>
              </tr>
            </thead>
            <tbody>
              {stats.recentApplications.map((a) => (
                <tr key={a.id}>
                  <td>
                    <Link
                      className="font-semibold text-primary"
                      href={`/admin/pelamar/${encodeURIComponent(a.id)}`}
                    >
                      {a.fullName || a.id}
                    </Link>
                  </td>
                  <td>{title.get(a.vacancyId) ?? "—"}</td>
                  <td>{STAGE_LABELS[a.currentStage]}</td>
                  <td>{APPLICATION_STATUS_LABELS[a.status]}</td>
                  <td>{formatDate(a.appliedAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {stats.recentApplications.length === 0 && (
            <p className="py-5 text-sm text-muted">Belum ada lamaran.</p>
          )}
        </div>
      </section>
    </div>
  );
}
