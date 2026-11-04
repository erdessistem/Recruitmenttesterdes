import Link from "next/link";
import { notFound } from "next/navigation";
import { repository } from "@/lib/repositories";
import { isVacancyPubliclyOpen } from "@/lib/domain/vacancy";
import { ApplicationForm } from "@/components/public/application-form";
export const dynamic = "force-dynamic";
export default async function ApplyPage({ params }: { params: Promise<{ slug: string }> }) {
  const vacancy = await repository.getVacancyBySlug((await params).slug);
  if (!vacancy || vacancy.status === "draft" || vacancy.status === "archived") notFound();
  return (
    <main className="mx-auto max-w-3xl px-6 py-10">
      <Link href={`/lowongan/${vacancy.slug}`} className="text-sm font-semibold text-primary">
        ← Kembali ke detail lowongan
      </Link>
      <h1 className="mt-8 text-3xl font-bold">Lamar {vacancy.title}</h1>
      <p className="mt-3 text-muted">
        Isi data berikut dengan benar. Kolom bertanda * wajib diisi.
      </p>
      {isVacancyPubliclyOpen(vacancy) ? (
        <ApplicationForm slug={vacancy.slug} />
      ) : (
        <p className="mt-8 rounded-xl border border-border bg-white p-6">
          Lowongan ini sedang tidak menerima lamaran.
        </p>
      )}
    </main>
  );
}
