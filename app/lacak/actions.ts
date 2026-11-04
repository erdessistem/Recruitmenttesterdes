"use server";
import { headers } from "next/headers";
import { repository } from "@/lib/repositories";
import { allowAttempt } from "@/lib/security/local-rate-limit";
import {
  LOOKUP_ERROR,
  lookupApplication,
  recoverApplications,
  revealRecoveredId,
  withdrawApplication,
} from "@/lib/public/tracking";

async function ip() {
  const h = await headers();
  return process.env.VERCEL
    ? (h.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown")
    : "local";
}
export async function lookup(input: { applicant_id: string; whatsapp: string }) {
  if (!allowAttempt("lookup", await ip(), 10, 600_000))
    return { ok: false as const, message: "Terlalu banyak percobaan. Coba lagi nanti." };
  const application = await lookupApplication(repository, input);
  return application
    ? { ok: true as const, token: application.token }
    : { ok: false as const, message: LOOKUP_ERROR };
}
export async function recover(input: { full_name: string; whatsapp: string }) {
  if (!allowAttempt("recovery", await ip(), 5, 900_000))
    return { ok: false as const, message: "Terlalu banyak percobaan. Coba lagi nanti." };
  const results = await recoverApplications(repository, input);
  if (!results.length) console.info("Recovery lookup failed");
  return { ok: true as const, results };
}
export async function reveal(handle: string) {
  if (!allowAttempt("reveal", await ip(), 10, 900_000)) return null;
  return revealRecoveredId(repository, handle);
}
export async function withdraw(token: string, input: { applicant_id: string; whatsapp: string }) {
  if (!allowAttempt("withdraw", await ip(), 10, 600_000))
    return { ok: false, message: "Terlalu banyak percobaan. Coba lagi nanti." };
  return withdrawApplication(repository, token, input);
}
