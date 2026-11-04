import { BackLink } from "@/components/ui/back-link";
import { notFound } from "next/navigation";
import { repository } from "@/lib/repositories";
import { VacancyForm } from "@/components/admin/vacancy-form";
import { requireAdmin } from "@/lib/auth/session";
export const metadata = { title: "Ubah lowongan" };
export default async function EditVacancy({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const vacancy = await repository.getVacancyById((await params).id);
  if (!vacancy) notFound();
  return (
    <div className="mx-auto max-w-4xl">
      <BackLink href="/admin/lowongan">Semua lowongan</BackLink>
      <h1 className="mt-4 text-3xl font-bold tracking-tight">Ubah lowongan</h1>
      <p className="mt-2 text-sm text-muted">{vacancy.id}</p>
      <VacancyForm vacancy={vacancy} />
    </div>
  );
}
