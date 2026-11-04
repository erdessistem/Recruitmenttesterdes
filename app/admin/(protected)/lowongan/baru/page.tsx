import Link from "next/link";
import { VacancyForm } from "@/components/admin/vacancy-form";
import { requireAdmin } from "@/lib/auth/session";
export default async function NewVacancy() {
  await requireAdmin();
  return (
    <div className="mx-auto max-w-4xl">
      <Link href="/admin/lowongan" className="text-sm font-semibold text-primary">
        ← Semua lowongan
      </Link>
      <h1 className="mt-6 text-3xl font-bold">Buat lowongan</h1>
      <VacancyForm />
    </div>
  );
}
