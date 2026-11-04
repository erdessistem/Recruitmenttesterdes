import "server-only";
import { randomBytes } from "node:crypto";
import type { Repository } from "@/lib/repositories/types";
import { trackingLookupSchema, lostIdRecoverySchema } from "@/lib/validation/tracking";
import { normalizeApplicantIdForLookup } from "@/lib/format/applicant-id";

export const LOOKUP_ERROR = "Data lamaran tidak ditemukan. Periksa kembali Applicant ID dan nomor WhatsApp.";
export async function lookupApplication(repo: Repository, input: unknown) {
  const result = trackingLookupSchema.safeParse(input);
  if (!result.success) return null;
  const application = await repo.getApplicationById(result.data.applicant_id);
  return application && application.whatsapp === result.data.whatsapp && application.token ? application : null;
}
export async function withdrawApplication(repo: Repository, token: string, input: unknown) {
  const application = await lookupApplication(repo, input);
  if (!application || application.token !== token) return { ok: false, message: LOOKUP_ERROR };
  if (application.status !== "active" || application.currentStage === "hired") return { ok: false, message: "Lamaran ini tidak dapat ditarik." };
  try { await repo.updateApplicationStage(application.id, application.currentStage, "withdrawn", "Kandidat mengundurkan diri.", "candidate"); return { ok: true, message: "Lamaran Anda telah ditarik." }; }
  catch { return { ok: false, message: "Lamaran tidak dapat ditarik. Muat ulang halaman dan coba lagi." }; }
}

type RecoveryTicket = { applicationId: string; expires: number };
const shared = globalThis as typeof globalThis & { __recoveryTickets?: Map<string, RecoveryTicket> };
const tickets = shared.__recoveryTickets ??= new Map<string, RecoveryTicket>();
export function maskApplicantId(id: string): string {
  const parts = id.split("-");
  if (parts.length < 3) return "••••••";
  return `${parts[0]}-${parts[1].slice(0, 1)}••••-${parts.at(-1)!.slice(0, 1)}•••••`;
}
export async function recoverApplications(repo: Repository, input: unknown, now = Date.now()) {
  const parsed = lostIdRecoverySchema.safeParse(input);
  if (!parsed.success) return [];
  const matches = await repo.getApplicationsForRecovery(parsed.data.whatsapp, parsed.data.full_name);
  for (const [key, ticket] of tickets) if (ticket.expires <= now) tickets.delete(key);
  return Promise.all(matches.filter(a => a.token && !a.anonymizedAt).map(async application => {
    const handle = randomBytes(32).toString("base64url");
    tickets.set(handle, { applicationId: application.id, expires: now + 5 * 60_000 });
    const vacancy = await repo.getVacancyById(application.vacancyId);
    return { handle, maskedId: maskApplicantId(application.id), vacancy: vacancy?.title ?? "Lowongan", appliedAt: application.appliedAt };
  }));
}
/** Opaque, short-lived, single-use handles prevent the masked result exposing IDs or tokens. */
export async function revealRecoveredId(repo: Repository, handle: string, now = Date.now()): Promise<string | null> {
  const ticket = tickets.get(handle);
  tickets.delete(handle);
  if (!ticket || ticket.expires <= now) return null;
  const application = await repo.getApplicationById(ticket.applicationId);
  return application && application.token && normalizeApplicantIdForLookup(application.id) === normalizeApplicantIdForLookup(ticket.applicationId) ? application.id : null;
}
