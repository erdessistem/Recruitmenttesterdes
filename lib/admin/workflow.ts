import "server-only";
import { STAGES, type Stage } from "@/lib/constants";
import type { Repository } from "@/lib/repositories/types";

export async function moveStage(
  repo: Repository,
  id: string,
  stage: string,
  note: string,
  actor: string,
) {
  const value = note.trim();
  if (!STAGES.includes(stage as Stage) || value.length > 1000)
    throw new Error("Tahap atau catatan publik tidak valid.");
  const current = await repo.reconcileApplicationStage(id);
  if (!current || current.status !== "active")
    throw new Error("Hanya lamaran aktif yang dapat dipindahkan.");
  return repo.updateApplicationStage(id, stage as Stage, "active", value, actor, Boolean(value));
}
export async function rejectApplication(
  repo: Repository,
  id: string,
  reason: string,
  actor: string,
) {
  const value = reason.trim();
  if (!value || value.length > 2000)
    throw new Error("Alasan penolakan wajib diisi (maksimal 2.000 karakter).");
  const current = await repo.reconcileApplicationStage(id);
  if (!current || current.status !== "active" || current.currentStage === "hired")
    throw new Error(
      "Lamaran tidak dapat ditolak. Kandidat diterima harus dipindahkan ke tahap lain terlebih dahulu.",
    );
  await repo.addNote(id, actor, `Alasan penolakan: ${value}`);
  try {
    return await repo.updateApplicationStage(id, current.currentStage, "rejected", "", actor);
  } catch {
    throw new Error(
      "Alasan tersimpan sebagai catatan internal, tetapi status belum diperbarui. Periksa riwayat sebelum mencoba lagi.",
    );
  }
}
export async function reopenApplication(repo: Repository, id: string, actor: string) {
  const current = await repo.reconcileApplicationStage(id);
  if (!current || current.status !== "rejected")
    throw new Error("Hanya lamaran yang ditolak dapat dibuka kembali.");
  const duplicate = await repo.findActiveApplicationByPhoneAndVacancy(
    current.whatsapp,
    current.vacancyId,
  );
  if (duplicate && duplicate.id !== current.id)
    throw new Error("Kandidat sudah memiliki lamaran aktif untuk lowongan ini.");
  return repo.updateApplicationStage(id, current.currentStage, "active", "", actor);
}
