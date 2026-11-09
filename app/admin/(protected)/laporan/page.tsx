import Link from "next/link";
import { repository } from "@/lib/repositories";
import { requireAdmin } from "@/lib/auth/session";
import { APPLICATION_SOURCE_LABELS, STAGE_LABELS } from "@/lib/constants";
import { PERIODS, buildReport, isPeriod, type Period } from "@/lib/admin/reports";
import { buttonClass } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { cn } from "@/lib/utils";

export const metadata = { title: "Laporan" };

const percent = (part: number, whole: number) => (whole ? Math.round((part / whole) * 100) : 0);
const days = (value: number | null) =>
  value == null
    ? "—"
    : value < 1
      ? "< 1 hari"
      : `${value.toLocaleString("id-ID", { maximumFractionDigits: 1 })} hari`;

/** One thin horizontal bar; the number beside it is the real label. */
function Bar({ value, max, label }: { value: number; max: number; label: string }) {
  const width = max > 0 ? Math.max((value / max) * 100, value > 0 ? 2 : 0) : 0;
  return (
    <div className="h-2.5 w-full rounded-full bg-paper" title={label} role="presentation">
      <div className="h-full rounded-full bg-primary" style={{ width: `${width}%` }} />
    </div>
  );
}

export default async function ReportsPage({
  searchParams,
}: {
  searchParams: Promise<{ periode?: string; lowongan?: string }>;
}) {
  await requireAdmin();
  const params = await searchParams;
  const period: Period = isPeriod(params.periode) ? params.periode : "90";
  const data = await repository.getReportData();
  const vacancyId = data.vacancies.some((v) => v.id === params.lowongan)
    ? params.lowongan
    : undefined;
  const report = buildReport(data, { period, vacancyId }, new Date());
  const { totals } = report;
  const link = (next: { periode?: string; lowongan?: string }) => {
    const query = new URLSearchParams();
    const merged = { periode: period, lowongan: vacancyId, ...next };
    if (merged.periode && merged.periode !== "90") query.set("periode", merged.periode);
    if (merged.lowongan) query.set("lowongan", merged.lowongan);
    const text = query.toString();
    return text ? `/admin/laporan?${text}` : "/admin/laporan";
  };
  const maxSource = Math.max(0, ...report.sources.map((row) => row.count));
  const maxDays = Math.max(0, ...report.durations.map((row) => row.days ?? 0));

  return (
    <div className="mx-auto max-w-6xl">
      <h1 className="text-3xl font-bold tracking-tight">Laporan</h1>
      <p className="mt-2 text-muted">
        Berdasarkan tanggal melamar. Diterima dihitung dari pelamar aktif di tahap Diterima.
      </p>

      <div className="mt-6 flex flex-wrap items-end justify-between gap-4">
        <nav aria-label="Periode" className="flex flex-wrap gap-2">
          {(Object.entries(PERIODS) as Array<[Period, string]>).map(([value, label]) => (
            <Link
              key={value}
              href={link({ periode: value })}
              aria-current={value === period ? "true" : undefined}
              className={cn(
                "inline-flex min-h-10 items-center rounded-full border px-4 text-sm font-semibold",
                value === period
                  ? "border-ink bg-ink text-white"
                  : "border-border bg-surface hover:border-border-strong",
              )}
            >
              {label}
            </Link>
          ))}
        </nav>
        <form className="flex items-end gap-2">
          {period !== "90" && <input type="hidden" name="periode" value={period} />}
          <label className="text-sm font-semibold">
            Lowongan
            <select
              name="lowongan"
              defaultValue={vacancyId ?? ""}
              className="control mt-2 min-w-56 font-normal"
            >
              <option value="">Semua lowongan</option>
              {data.vacancies.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.title}
                </option>
              ))}
            </select>
          </label>
          <button className={buttonClass("secondary")}>Terapkan</button>
        </form>
      </div>

      <dl className="mt-6 grid grid-cols-2 gap-px overflow-hidden rounded-panel border border-border bg-border sm:grid-cols-5">
        {(
          [
            ["Pelamar", totals.total],
            ["Dalam proses", totals.inProcess],
            ["Diterima", totals.hired],
            ["Ditolak", totals.rejected],
            ["Mengundurkan diri", totals.withdrawn],
          ] as const
        ).map(([label, value]) => (
          <div key={label} className="bg-surface px-5 py-4">
            <dt className="text-sm text-muted">{label}</dt>
            <dd className="tabular mt-1 text-3xl font-bold">{value}</dd>
          </div>
        ))}
      </dl>

      {totals.total === 0 ? (
        <EmptyState className="mt-6" title="Belum ada pelamar di periode ini">
          Pilih periode yang lebih panjang atau lowongan lain.
        </EmptyState>
      ) : (
        <>
          <section className="admin-card mt-6">
            <h2 className="text-lg font-bold">Sumber pelamar</h2>
            <p className="mt-1 text-sm text-muted">
              Dari mana pelamar tahu lowongan, dan berapa yang sampai interview atau diterima.
            </p>
            <div className="-mx-6 mt-4 overflow-x-auto">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Sumber</th>
                    <th className="w-[40%]">Pelamar</th>
                    <th className="text-right">Sampai interview</th>
                    <th className="text-right">Diterima</th>
                  </tr>
                </thead>
                <tbody>
                  {report.sources.map((row) => (
                    <tr key={row.source}>
                      <td className="font-semibold">{APPLICATION_SOURCE_LABELS[row.source]}</td>
                      <td>
                        <div className="flex items-center gap-3">
                          <Bar value={row.count} max={maxSource} label={`${row.count} pelamar`} />
                          <span className="tabular w-8 shrink-0 text-right">{row.count}</span>
                        </div>
                      </td>
                      <td className="tabular text-right">
                        {row.interview}{" "}
                        <span className="text-muted">({percent(row.interview, row.count)}%)</span>
                      </td>
                      <td className="tabular text-right">
                        {row.hired}{" "}
                        <span className="text-muted">({percent(row.hired, row.count)}%)</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section className="admin-card mt-6">
            <h2 className="text-lg font-bold">Corong tahapan</h2>
            <p className="mt-1 text-sm text-muted">
              Berapa pelamar yang pernah mencapai setiap tahap, termasuk yang kemudian ditolak atau
              mundur. Persentase dari total pelamar.
            </p>
            <ol className="mt-4 space-y-3">
              {report.funnel.map((row) => (
                <li
                  key={row.stage}
                  className="grid grid-cols-[8rem_1fr_5.5rem] items-center gap-3 text-sm sm:grid-cols-[10rem_1fr_6rem]"
                >
                  <span>{STAGE_LABELS[row.stage]}</span>
                  <Bar value={row.count} max={totals.total} label={`${row.count} pelamar`} />
                  <span className="tabular text-right">
                    {row.count}{" "}
                    <span className="text-muted">({percent(row.count, totals.total)}%)</span>
                  </span>
                </li>
              ))}
            </ol>

            {!vacancyId && report.byVacancy.length > 1 && (
              <div className="-mx-6 mt-6 overflow-x-auto border-t border-border pt-2">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Lowongan</th>
                      {report.funnel.map((row) => (
                        <th key={row.stage} className="text-right">
                          {STAGE_LABELS[row.stage]}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {report.byVacancy.map((row) => (
                      <tr key={row.vacancy.id}>
                        <td>
                          <Link
                            className="font-semibold text-primary hover:underline"
                            href={link({ lowongan: row.vacancy.id })}
                          >
                            {row.vacancy.title}
                          </Link>
                        </td>
                        {row.funnel.map((cell) => (
                          <td key={cell.stage} className="tabular text-right">
                            {cell.count}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          <section className="admin-card mt-6">
            <div className="flex flex-wrap items-baseline justify-between gap-3">
              <h2 className="text-lg font-bold">Kecepatan proses</h2>
              <p className="text-sm">
                Rata-rata melamar sampai diterima:{" "}
                <span className="tabular font-bold">{days(report.timeToHire.days)}</span>
                {report.timeToHire.samples > 0 && (
                  <span className="text-muted"> (dari {report.timeToHire.samples} kandidat)</span>
                )}
              </p>
            </div>
            <p className="mt-1 text-sm text-muted">
              Rata-rata lama di setiap tahap sebelum dipindahkan. Kandidat yang masih di tahap itu
              belum dihitung.
            </p>
            <ol className="mt-4 space-y-3">
              {report.durations.map((row) => (
                <li
                  key={row.stage}
                  className="grid grid-cols-[8rem_1fr_5.5rem] items-center gap-3 text-sm sm:grid-cols-[10rem_1fr_6rem]"
                >
                  <span>{STAGE_LABELS[row.stage]}</span>
                  <Bar value={row.days ?? 0} max={maxDays} label={days(row.days)} />
                  <span className="tabular text-right">
                    {days(row.days)}
                    {row.samples > 0 && (
                      <span className="block text-xs text-muted">{row.samples} kali</span>
                    )}
                  </span>
                </li>
              ))}
            </ol>
          </section>
        </>
      )}
    </div>
  );
}
