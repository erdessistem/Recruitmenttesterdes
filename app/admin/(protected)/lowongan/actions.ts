"use server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth/session";
import { repository } from "@/lib/repositories";
import { vacancyFormSchema } from "@/lib/validation/vacancy";
import { RepositoryError } from "@/lib/repositories/errors";
import { VACANCY_STATUSES, type VacancyStatus } from "@/lib/constants";

export type FormResult = { message: string; errors?: Record<string, string[]> };
export async function saveVacancy(
  id: string | null,
  _previous: FormResult,
  form: FormData,
): Promise<FormResult> {
  await requireAdmin();
  const parsed = vacancyFormSchema.safeParse(Object.fromEntries(form.entries()));
  if (!parsed.success)
    return {
      message: "Periksa kembali data lowongan.",
      errors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    };
  const d = parsed.data;
  const input = {
    title: d.title,
    slug: d.slug,
    positionCode: d.position_code,
    department: d.department,
    location: d.location,
    employmentType: d.employment_type,
    description: d.description,
    requirements: d.requirements,
    quota: d.quota,
    openAt: d.open_at,
    closeAt: d.close_at,
    status: d.status,
  };
  try {
    if (id) await repository.updateVacancy(id, input);
    else await repository.createVacancy(input);
  } catch (error) {
    return {
      message:
        error instanceof RepositoryError
          ? error.message
          : "Lowongan belum dapat disimpan. Silakan coba lagi.",
    };
  }
  revalidatePath("/");
  revalidatePath("/admin/lowongan");
  redirect("/admin/lowongan");
}
export async function changeVacancyStatus(form: FormData) {
  await requireAdmin();
  const id = String(form.get("id") ?? "");
  const status = String(form.get("status") ?? "");
  if (!VACANCY_STATUSES.includes(status as VacancyStatus)) throw new Error("Status tidak valid.");
  await repository.updateVacancy(id, { status: status as VacancyStatus });
  revalidatePath("/");
  revalidatePath("/admin/lowongan");
}
