import { cache } from "react";
import { notFound } from "next/navigation";
import { repository } from "@/lib/repositories";
import { isVacancyPubliclyOpen } from "@/lib/domain/vacancy";
import { EMPLOYMENT_TYPE_LABELS } from "@/lib/constants";
import { formatDate } from "@/lib/format/date";
import { BackLink } from "@/components/ui/back-link";
import { ButtonLink } from "@/components/ui/button";
export const dynamic = "force-dynamic";
/** Deduplicates the Sheets read shared by metadata and the page. */
const getVacancy = cache((slug: string) => repository.getVacancyBySlug(slug));
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const vacancy = await getVacancy((await params).slug);
  return { title: vacancy?.title ?? "Lowongan" };
}
export default async function VacancyPage({ params }: { params: Promise<{ slug: string }> }) {
  const vacancy = await getVacancy((await params).slug);
  if (!vacancy || vacancy.status === "draft" || vacancy.status === "archived") notFound();
  const open = isVacancyPubliclyOpen(vacancy);
  const facts = [
    ["Departemen", vacancy.department],
    ["Lokasi", vacancy.location],
    ["Jenis pekerjaan", EMPLOYMENT_TYPE_LABELS[vacancy.employmentType]],
    ["Kuota", `${vacancy.quota} orang`],
    ["Dibuka", vacancy.openAt ? formatDate(vacancy.openAt) : "—"],
    ["Ditutup", vacancy.closeAt ? formatDate(vacancy.closeAt) : "Tanpa batas waktu"],
  ] as const;
  return (
    <main className="mx-auto max-w-6xl px-4 pb-28 pt-8 sm:px-6 sm:pt-10 lg:pb-10">
      <BackLink href="/#lowongan">Semua lowongan</BackLink>
      <div className="mt-6 grid gap-8 lg:grid-cols-[minmax(0,1fr)_20rem] lg:items-start">
        <article className="rounded-panel border border-border bg-surface p-6 sm:p-10">
          <p className="text-sm font-semibold text-primary">{vacancy.department}</p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">{vacancy.title}</h1>
          <h2 className="mt-10 text-xl font-bold">Tentang posisi ini</h2>
          <p className="mt-3 max-w-[70ch] whitespace-pre-line leading-7">{vacancy.description}</p>
          <h2 className="mt-10 text-xl font-bold">Persyaratan</h2>
          <p className="mt-3 max-w-[70ch] whitespace-pre-line leading-7">{vacancy.requirements}</p>
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
        </aside>
      </div>
      {open && (
        <div className="no-print fixed inset-x-0 bottom-0 z-20 border-t border-border bg-surface/95 px-4 py-3 backdrop-blur lg:hidden">
          <ButtonLink href={`/lowongan/${vacancy.slug}/lamar`} className="w-full">
            Lamar posisi ini
          </ButtonLink>
        </div>
      )}
    </main>
  );
}
