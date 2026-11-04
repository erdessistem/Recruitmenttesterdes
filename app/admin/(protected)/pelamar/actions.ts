"use server";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth/session";
import { repository } from "@/lib/repositories";
import { moveStage, rejectApplication, reopenApplication } from "@/lib/admin/workflow";

export async function updateApplicant(
  id: string,
  input: { action: string; stage?: string; note?: string; confirmed?: boolean },
) {
  const admin = await requireAdmin();
  if (input.confirmed !== true)
    return { ok: false, message: "Konfirmasi tindakan terlebih dahulu." };
  try {
    if (input.action === "move")
      await moveStage(repository, id, input.stage ?? "", input.note ?? "", admin.email);
    else if (input.action === "reject")
      await rejectApplication(repository, id, input.note ?? "", admin.email);
    else if (input.action === "reopen") await reopenApplication(repository, id, admin.email);
    else if (input.action === "note") await repository.addNote(id, admin.email, input.note ?? "");
    else return { ok: false, message: "Tindakan tidak valid." };
    revalidatePath("/admin");
    revalidatePath("/admin/pelamar");
    revalidatePath(`/admin/pelamar/${encodeURIComponent(id)}`);
    revalidatePath("/lacak", "layout");
    return { ok: true, message: "Perubahan berhasil disimpan." };
  } catch (error) {
    return {
      ok: false,
      message:
        error instanceof Error
          ? error.message
          : "Perubahan belum dapat disimpan. Silakan coba lagi.",
    };
  }
}
