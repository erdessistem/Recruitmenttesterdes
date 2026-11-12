import { BackLink } from "@/components/ui/back-link";
import { VacancyForm } from "@/components/admin/vacancy-form";
import { requireRole } from "@/lib/auth/session";
export const metadata = { title: "Buat lowongan" };
export default async function NewVacancy() {
  await requireRole("hr");
  return (
    <div className="mx-auto max-w-4xl">
      <BackLink href="/admin/lowongan">Semua lowongan</BackLink>
      <h1 className="mt-4 text-h2">Buat lowongan</h1>
      <VacancyForm />
    </div>
  );
}
