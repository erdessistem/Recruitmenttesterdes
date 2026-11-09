"use server";
import { headers } from "next/headers";
import { repository } from "@/lib/repositories";
import { submitApplication, type SubmitResult } from "@/lib/public/submit-application";

import { allowAttempt } from "@/lib/security/rate-limit";
export async function apply(
  slug: string,
  input: Record<string, unknown>,
  key: string,
): Promise<SubmitResult> {
  const requestHeaders = await headers();
  const ip = process.env.VERCEL
    ? (requestHeaders.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown")
    : "local";
  if (!(await allowAttempt("apply", ip, 3, 3_600_000)))
    return { ok: false, message: "Terlalu banyak percobaan. Silakan coba lagi dalam satu jam." };
  try {
    return await submitApplication(repository, slug, input, key);
  } catch {
    return {
      ok: false,
      message: "Lamaran belum dapat diproses. Silakan coba lagi dengan formulir ini.",
    };
  }
}
