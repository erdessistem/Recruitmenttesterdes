import { notFound } from "next/navigation";
import { repository } from "@/lib/repositories";
import { isVacancyPubliclyOpen } from "@/lib/domain/vacancy";
import { ApplicationForm } from "@/components/public/application-form";
import { toPublicQuestions } from "@/lib/public/screening";
import { BackLink } from "@/components/ui/back-link";
export const dynamic = "force-dynamic";
export const metadata = { title: "Formulir lamaran" };
export default async function ApplyPage({ params }: { params: Promise<{ slug: string }> }) {
  const vacancy = await repository.getVacancyBySlug((await params).slug);
  if (!vacancy || vacancy.status === "draft" || vacancy.status === "archived") notFound();
  return (
    <main className="mx-auto max-w-3xl px-4 py-8 sm:px-6 sm:py-10">
      <BackLink href={`/lowongan/${vacancy.slug}`}>Detail lowongan</BackLink>
      <h1 className="mt-6 text-3xl font-bold tracking-tight">Lamar {vacancy.title}</h1>
      <p className="mt-3 text-muted">
        Isi data berikut dengan benar. Kolom bertanda * wajib diisi.
      </p>
      {isVacancyPubliclyOpen(vacancy) ? (
        <ApplicationForm
          slug={vacancy.slug}
          questions={toPublicQuestions(vacancy.screeningQuestions)}
        />
      ) : (
        <p className="mt-8 rounded-panel border border-border bg-surface p-6">
          Lowongan ini sedang tidak menerima lamaran.
        </p>
      )}
    </main>
  );
}
