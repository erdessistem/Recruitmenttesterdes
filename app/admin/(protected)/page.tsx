import Link from "next/link";
import { repository } from "@/lib/repositories";
import { APPLICATION_STATUS_LABELS, STAGE_LABELS, STAGES } from "@/lib/constants";
import { formatDate } from "@/lib/format/date";
import { requireAdmin } from "@/lib/auth/session";
import { StageMeter } from "@/components/ui/stage-line";
import { EmptyState } from "@/components/ui/empty-state";
export const metadata = { title: { absolute: "Dashboard · Admin Erdes" } };
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
    ["Baru dalam 7 hari", stats.newApplicantsLast7Days],
  ] as const;
  const active = STAGES.reduce((sum, stage) => sum + stats.stageCounts[stage], 0);
  return (
    <div className="mx-auto max-w-7xl">
      <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
      <dl className="mt-6 grid grid-cols-2 gap-px overflow-hidden rounded-panel border border-border bg-border xl:grid-cols-4">
        {cards.map(([label, count]) => (
          <div key={label} className="bg-surface px-5 py-4">
            <dt className="text-sm text-muted">{label}</dt>
            <dd className="tabular mt-1 text-3xl font-bold">{count}</dd>
          </div>
        ))}
      </dl>

      <section className="admin-card mt-6">
        <div className="flex flex-wrap items-baseline justify-between gap-3">
          <h2 className="text-lg font-bold">Pelamar aktif per tahap</h2>
          <p className="text-sm text-muted">
            {active} aktif, {stats.rejectedCount} ditolak, {stats.withdrawnCount} mengundurkan diri
          </p>
        </div>
        <div className="-mx-2 mt-6 overflow-x-auto px-2 pb-1">
          <ol className="relative grid min-w-[36rem] grid-cols-6">
            <div
              aria-hidden="true"
              className="absolute inset-x-[8.333%] top-[46px] h-1 rounded-full bg-primary-soft"
            />
            {STAGES.map((stage) => {
              const count = stats.stageCounts[stage];
              return (
                <li key={stage} className="relative flex flex-col items-center text-center">
                  <Link
                    href={`/admin/pelamar?stage=${stage}&status=active`}
                    className="group flex flex-col items-center rounded-control px-2 pb-1 hover:bg-paper"
                  >
                    <span className="tabular text-2xl font-bold leading-8">{count}</span>
                    <span className="flex h-6 items-center">
                      <span
                        aria-hidden="true"
                        className={
                          count > 0
                            ? "relative z-10 h-4 w-4 rounded-full border-2 border-primary bg-primary"
                            : "relative z-10 h-4 w-4 rounded-full border-2 border-border-strong bg-surface"
                        }
                      />
                    </span>
                    <span className="mt-1 text-sm text-muted group-hover:text-foreground">
                      {STAGE_LABELS[stage]}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ol>
        </div>
      </section>

      <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <section className="admin-card min-w-0">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-lg font-bold">Lamaran terbaru</h2>
            <Link
              href="/admin/pelamar"
              className="text-sm font-semibold text-primary hover:underline"
            >
              Semua pelamar
            </Link>
          </div>
          {stats.recentApplications.length ? (
            <div className="-mx-6 mt-3 overflow-x-auto">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Nama</th>
                    <th>Lowongan</th>
                    <th>Tahap</th>
                    <th>Tanggal</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.recentApplications.map((a) => (
                    <tr key={a.id}>
                      <td>
                        <Link
                          className="font-semibold text-primary hover:underline"
                          href={`/admin/pelamar/${encodeURIComponent(a.id)}`}
                        >
                          {a.fullName || a.id}
                        </Link>
                      </td>
                      <td>{title.get(a.vacancyId) ?? "—"}</td>
                      <td>
                        <span className="inline-flex items-center gap-2">
                          <StageMeter currentStage={a.currentStage} status={a.status} />
                          {a.status === "active"
                            ? STAGE_LABELS[a.currentStage]
                            : APPLICATION_STATUS_LABELS[a.status]}
                        </span>
                      </td>
                      <td className="tabular text-muted">{formatDate(a.appliedAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <EmptyState className="mt-4" title="Belum ada lamaran">
              Lamaran baru akan muncul di sini.
            </EmptyState>
          )}
        </section>
        <section className="admin-card min-w-0">
          <h2 className="text-lg font-bold">Pelamar per lowongan</h2>
          <ul className="mt-3 divide-y divide-border">
            {stats.applicantsPerVacancy.map((v) => (
              <li key={v.vacancyId}>
                <Link
                  href={`/admin/pelamar?vacancy=${encodeURIComponent(v.vacancyId)}`}
                  className="-mx-2 flex justify-between gap-4 rounded-control px-2 py-3 text-sm hover:bg-paper"
                >
                  <span>{v.title}</span>
                  <span className="tabular font-semibold">{v.count}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}
