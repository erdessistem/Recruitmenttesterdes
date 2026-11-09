"use server";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth/session";
import { repository } from "@/lib/repositories";
import { moveStage, rejectApplication, reopenApplication } from "@/lib/admin/workflow";
import { STAGES, type Stage } from "@/lib/constants";

function revalidateAdmin(ids: string[]) {
  revalidatePath("/admin");
  revalidatePath("/admin/pelamar");
  for (const id of ids) revalidatePath(`/admin/pelamar/${encodeURIComponent(id)}`);
  revalidatePath("/lacak", "layout");
}

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
    revalidateAdmin([id]);
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

/** Moves or rejects several applicants in one write. Ineligible ones are skipped and listed. */
export async function bulkUpdateApplicants(
  ids: string[],
  input: { action: "move" | "reject"; stage?: string; note?: string },
) {
  const admin = await requireAdmin();
  const list = Array.isArray(ids) ? ids.filter((id) => typeof id === "string" && id) : [];
  if (list.length === 0) return { ok: false, message: "Pilih pelamar terlebih dahulu." };
  const note = (input.note ?? "").trim();
  if (input.action === "move" && !STAGES.includes(input.stage as Stage))
    return { ok: false, message: "Pilih tahap tujuan." };
  if (input.action === "reject" && !note)
    return { ok: false, message: "Alasan penolakan wajib diisi." };
  try {
    const result = await repository.bulkUpdateApplications(
      list,
      input.action === "move"
        ? { type: "move", stage: input.stage as Stage, note }
        : { type: "reject", reason: note },
      admin.email,
    );
    revalidateAdmin(result.updated);
    const verb = input.action === "move" ? "dipindahkan" : "ditolak";
    return {
      ok: result.updated.length > 0,
      message: result.skipped.length
        ? `${result.updated.length} pelamar ${verb}, ${result.skipped.length} dilewati.`
        : `${result.updated.length} pelamar ${verb}.`,
      skipped: result.skipped,
    };
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : "Perubahan belum dapat disimpan.",
    };
  }
}
