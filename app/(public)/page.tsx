import Link from "next/link";
import { CalendarDays, ChevronRight, MapPin } from "lucide-react";
import { repository } from "@/lib/repositories";
import { EMPLOYMENT_TYPE_LABELS } from "@/lib/constants";
import { formatDate } from "@/lib/format/date";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { buttonClass } from "@/components/ui/button";

export const dynamic = "force-dynamic";

const DAY = 86_400_000;

const steps = [
  { title: "Lamar online", body: "Isi formulir sekitar 5 menit. Tidak perlu membuat akun." },
  { title: "Simpan Applicant ID", body: "Anda langsung menerima ID dan link lacak pribadi." },
  { title: "Lacak status", body: "Cek tahap lamaran kapan saja dengan ID dan nomor WhatsApp." },
];

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; department?: string; location?: string; type?: string }>;
}) {
  const filters = await searchParams;
  const vacancies = await repository.getOpenVacancies();
  const unique = (values: string[]) => [...new Set(values)].sort();
  const filtered = vacancies.filter(
    (v) =>
      (!filters.q ||
        `${v.title} ${v.department} ${v.location}`
          .toLowerCase()
          .includes(filters.q.toLowerCase())) &&
      (!filters.department || v.department === filters.department) &&
      (!filters.location || v.location === filters.location) &&
      (!filters.type || v.employmentType === filters.type),
  );
  const filtering = Boolean(filters.q || filters.department || filters.location || filters.type);
  const now = Date.now();

  return (
    <main>
      <section className="border-b border-border bg-surface">
        <div className="mx-auto grid max-w-6xl gap-12 px-4 py-14 sm:px-6 sm:py-20 lg:grid-cols-[1.1fr_1fr] lg:items-end">
          <div>
            <h1 className="max-w-xl text-4xl font-bold leading-[1.1] tracking-tight sm:text-5xl">
              Langkah berikutnya dimulai di sini.
            </h1>
            <p className="mt-5 max-w-md text-lg leading-relaxed text-muted">
              Temukan kesempatan untuk bertumbuh dan berkarya bersama Erdes Group.
            </p>
            <a href="#lowongan" className={buttonClass("primary", "mt-8 px-5")}>
              Lihat {vacancies.length} lowongan terbuka
            </a>
          </div>
          <ol aria-label="Cara melamar" className="relative space-y-6">
            <div
              aria-hidden="true"
              className="absolute bottom-[34px] left-[10px] top-2 w-1 rounded-full bg-primary-soft"
            />
            {steps.map((step, index) => (
              <li key={step.title} className="relative flex gap-4">
                <span
                  aria-hidden="true"
                  className={
                    index === 0
                      ? "relative z-10 mt-0.5 h-6 w-6 shrink-0 rounded-full border-2 border-sinyal-ink bg-sinyal"
                      : "relative z-10 mx-1 mt-1.5 h-4 w-4 shrink-0 rounded-full border-2 border-primary bg-surface"
                  }
                />
                <div>
                  <p className="font-semibold">{step.title}</p>
                  <p className="mt-0.5 text-sm leading-relaxed text-muted">{step.body}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section id="lowongan" className="mx-auto max-w-6xl scroll-mt-4 px-4 py-14 sm:px-6">
        <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">Lowongan terbuka</h2>
        <form className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-[2fr_1fr_1fr_1fr_auto]">
          <label className="sr-only" htmlFor="q">
            Cari lowongan
          </label>
          <input
            className="control"
            id="q"
            name="q"
            type="search"
            defaultValue={filters.q}
            placeholder="Cari posisi atau lokasi"
          />
          <select
            className="control"
            name="department"
            aria-label="Departemen"
            defaultValue={filters.department ?? ""}
          >
            <option value="">Semua departemen</option>
            {unique(vacancies.map((v) => v.department)).map((v) => (
              <option key={v}>{v}</option>
            ))}
          </select>
          <select
            className="control"
            name="location"
            aria-label="Lokasi"
            defaultValue={filters.location ?? ""}
          >
            <option value="">Semua lokasi</option>
            {unique(vacancies.map((v) => v.location)).map((v) => (
              <option key={v}>{v}</option>
            ))}
          </select>
          <select
            className="control"
            name="type"
            aria-label="Jenis pekerjaan"
            defaultValue={filters.type ?? ""}
          >
            <option value="">Semua jenis</option>
            {unique(vacancies.map((v) => v.employmentType)).map((v) => (
              <option key={v} value={v}>
                {EMPLOYMENT_TYPE_LABELS[v as keyof typeof EMPLOYMENT_TYPE_LABELS]}
              </option>
            ))}
          </select>
          <button className={buttonClass("primary")}>Cari</button>
        </form>

        <div className="mb-3 mt-8 flex items-center justify-between gap-4 text-sm text-muted">
          <p aria-live="polite">{filtered.length} lowongan</p>
          {filtering && (
            <Link href="/#lowongan" className="font-semibold text-primary hover:underline">
              Hapus filter
            </Link>
          )}
        </div>

        {filtered.length > 0 ? (
          <ul className="divide-y divide-border overflow-hidden rounded-panel border border-border bg-surface">
            {filtered.map((v) => {
              const closesSoon =
                v.closeAt != null &&
                new Date(v.closeAt).getTime() - now >= 0 &&
                new Date(v.closeAt).getTime() - now <= 7 * DAY;
              return (
                <li key={v.id} className="group relative transition-colors hover:bg-paper">
                  <div className="flex items-center gap-4 px-5 py-5 sm:px-6">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                        <h3 className="text-lg font-semibold">
                          <Link
                            href={`/lowongan/${v.slug}`}
                            className="after:absolute after:inset-0"
                          >
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
                        <span className="inline-flex items-center gap-1.5">
                          <CalendarDays aria-hidden="true" className="h-4 w-4" />
                          {v.closeAt ? `Ditutup ${formatDate(v.closeAt)}` : "Tanpa batas waktu"}
                        </span>
                      </div>
                    </div>
                    <ChevronRight
                      aria-hidden="true"
                      className="h-5 w-5 shrink-0 text-muted transition-transform group-hover:translate-x-0.5 motion-reduce:transition-none"
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
              <Link href="/#lowongan" className={buttonClass("secondary")}>
                Hapus filter
              </Link>
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
      </section>
    </main>
  );
}
