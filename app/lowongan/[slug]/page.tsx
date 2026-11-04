import Link from "next/link";
import { notFound } from "next/navigation";
import { repository } from "@/lib/repositories";
import { isVacancyPubliclyOpen } from "@/lib/domain/vacancy";
import { EMPLOYMENT_TYPE_LABELS } from "@/lib/constants";
import { formatDate } from "@/lib/format/date";
export const dynamic = "force-dynamic";
export default async function VacancyPage({ params }: { params: Promise<{ slug: string }> }) {
  const vacancy = await repository.getVacancyBySlug((await params).slug);
  if (!vacancy || vacancy.status === "draft" || vacancy.status === "archived") notFound();
  const open = isVacancyPubliclyOpen(vacancy);
  return <main className="mx-auto max-w-4xl px-6 py-10"><Link href="/" className="text-sm font-semibold text-primary">← Semua lowongan</Link><div className="mt-8 rounded-xl border border-border bg-surface p-6 sm:p-10"><p className="text-sm font-semibold uppercase tracking-widest text-primary">{vacancy.department}</p><h1 className="mt-3 text-3xl font-bold sm:text-4xl">{vacancy.title}</h1><p className="mt-4 text-muted">{vacancy.location} · {EMPLOYMENT_TYPE_LABELS[vacancy.employmentType]} · Kuota {vacancy.quota}</p><p className="mt-2 text-sm text-muted">Dibuka: {vacancy.openAt ? formatDate(vacancy.openAt) : "—"} · Ditutup: {vacancy.closeAt ? formatDate(vacancy.closeAt) : "—"}</p><div className="my-8 border-t border-border"/><h2 className="text-xl font-bold">Tentang posisi ini</h2><p className="mt-3 whitespace-pre-line leading-7">{vacancy.description}</p><h2 className="mt-8 text-xl font-bold">Persyaratan</h2><p className="mt-3 whitespace-pre-line leading-7">{vacancy.requirements}</p><div className="mt-10">{open ? <Link className="inline-block rounded-control bg-primary px-6 py-3 font-semibold text-white" href={`/lowongan/${vacancy.slug}/lamar`}>Lamar posisi ini →</Link> : <p className="rounded-control bg-slate-100 p-4 text-muted">Lowongan ini sedang tidak menerima lamaran.</p>}</div></div></main>;
}
