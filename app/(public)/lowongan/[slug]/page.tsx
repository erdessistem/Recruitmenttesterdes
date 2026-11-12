import { cache } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { repository } from "@/lib/repositories";
import { isVacancyPubliclyOpen } from "@/lib/domain/vacancy";
import { EMPLOYMENT_TYPE_LABELS } from "@/lib/constants";
import { formatSalaryRange } from "@/lib/format/currency";
import { formatDate } from "@/lib/format/date";
import { BackLink } from "@/components/ui/back-link";
import { ButtonLink } from "@/components/ui/button";
import { StageRoute } from "@/components/ui/stage-line";
import { ScamNotice } from "@/components/public/scam-notice";
import { ShareVacancy } from "@/components/public/share-vacancy";
export const dynamic = "force-dynamic";
/** One Sheets load shared by metadata and the page. */
const getData = cache((slug: string) => repository.getVacancyPageData(slug));
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { vacancy } = await getData((await params).slug);
  if (!vacancy || vacancy.status === "draft" || vacancy.status === "archived") {
    return { title: "Lowongan" };
  }
  const description = `${vacancy.department}, ${vacancy.location}. ${vacancy.description}`
    .replace(/\s+/g, " ")
    .slice(0, 160);
  return {
    title: vacancy.title,
    description,
    openGraph: { title: `${vacancy.title} · PT Erdes Desa Maju Bersama`, description, type: "website" },
  };
}
export default async function VacancyPage({ params }: { params: Promise<{ slug: string }> }) {
  const { vacancy, others, companyProfile } = await getData((await params).slug);
  if (!vacancy || vacancy.status === "draft" || vacancy.status === "archived") notFound();
  const open = isVacancyPubliclyOpen(vacancy);
  const salary = vacancy.salaryVisible
    ? formatSalaryRange(vacancy.salaryMin, vacancy.salaryMax)
    : null;
  const facts = [
    ["Departemen", vacancy.department],
    ["Lokasi", vacancy.location],
    ["Jenis pekerjaan", EMPLOYMENT_TYPE_LABELS[vacancy.employmentType]],
    ...(salary ? ([["Gaji", `${salary} per bulan`]] as const) : []),
    ["Kuota", `${vacancy.quota} orang`],
    ["Dibuka", vacancy.openAt ? formatDate(vacancy.openAt) : "-"],
    ["Ditutup", vacancy.closeAt ? formatDate(vacancy.closeAt) : "Tanpa batas waktu"],
  ] as const;
  return (
    <main className="mx-auto max-w-6xl px-4 pb-28 pt-8 sm:px-6 sm:pt-10 lg:pb-10">
      <BackLink href="/#lowongan">Semua lowongan</BackLink>
      <div className="mt-6 grid gap-8 lg:grid-cols-[minmax(0,1fr)_20rem] lg:items-start">
        <article className="rounded-panel border border-border bg-surface p-6 sm:p-10">
          <h1 className="text-h1">{vacancy.title}</h1>
          <h2 className="mt-10 text-h2">Tentang posisi ini</h2>
          <p className="mt-3 max-w-[70ch] whitespace-pre-line leading-7">{vacancy.description}</p>
          <h2 className="mt-10 text-h2">Persyaratan</h2>
          <p className="mt-3 max-w-[70ch] whitespace-pre-line leading-7">{vacancy.requirements}</p>
          <h2 className="mt-10 text-h2">Proses rekrutmen</h2>
          <p className="mt-2 max-w-[70ch] text-sm leading-6 text-muted">
            Setelah melamar, Anda menerima Applicant ID untuk memantau tahap berikut kapan saja.
          </p>
          <StageRoute className="mt-6" />
        </article>
        <aside className="rounded-panel border border-border bg-surface p-6 lg:sticky lg:top-6">
          <dl className="space-y-3 text-sm">
            {facts.map(([label, value]) => (
              <div key={label} className="flex justify-between gap-4">
                <dt className="text-muted">{label}</dt>
                <dd className="text-right font-medium">{value}</dd>
              </div>
            ))}
          </dl>
          <div className="mt-6 border-t border-border pt-6">
            {open ? (
              <>
                <ButtonLink href={`/lowongan/${vacancy.slug}/lamar`} className="w-full">
                  Lamar posisi ini
                </ButtonLink>
                <p className="mt-3 text-center text-xs text-muted">
                  Sekitar 5 menit, tanpa membuat akun.
                </p>
              </>
            ) : (
              <p className="rounded-control bg-paper p-4 text-sm text-muted">
                Lowongan ini sedang tidak menerima lamaran.
              </p>
            )}
          </div>
          <div className="mt-6 border-t border-border pt-6">
            <p className="mb-3 text-sm font-semibold">Bagikan lowongan</p>
            <ShareVacancy title={vacancy.title} />
          </div>
          <ScamNotice className="mt-6" whatsapp={companyProfile.contactWhatsapp} />
        </aside>
      </div>
      {others.length > 0 && (
        <section className="mt-12">
          <h2 className="text-h2">Lowongan lainnya</h2>
          <ul className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {others.slice(0, 6).map((other) => (
              <li key={other.id}>
                <Link
                  href={`/lowongan/${other.slug}`}
                  className="block h-full rounded-panel border border-border bg-surface p-5 transition-colors hover:border-navy motion-reduce:transition-none"
                >
                  <p className="font-display text-h3">{other.title}</p>
                  <p className="mt-1 text-sm text-muted">{other.location}</p>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
      {open && (
        <div className="no-print fixed inset-x-0 bottom-0 z-20 border-t border-border bg-cream/95 px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3 backdrop-blur lg:hidden">
          <ButtonLink href={`/lowongan/${vacancy.slug}/lamar`} className="w-full">
            Lamar posisi ini
          </ButtonLink>
        </div>
      )}
    </main>
  );
}
