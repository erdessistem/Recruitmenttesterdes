"use server";
import { headers } from "next/headers";
import { repository } from "@/lib/repositories";
import { submitApplication, type SubmitResult } from "@/lib/public/submit-application";

const buckets = globalThis as typeof globalThis & { __applicationRate?: Map<string, number[]> };
const attempts = buckets.__applicationRate ??= new Map<string, number[]>();
export async function apply(slug: string, input: Record<string, unknown>, key: string): Promise<SubmitResult> {
  const requestHeaders = await headers();
  const ip = process.env.VERCEL ? requestHeaders.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown" : "local";
  const now = Date.now();
  const recent = (attempts.get(ip) ?? []).filter((time) => time > now - 3_600_000);
  if (recent.length >= 3) return { ok: false, message: "Terlalu banyak percobaan. Silakan coba lagi dalam satu jam." };
  recent.push(now); attempts.set(ip, recent);
  try { return await submitApplication(repository, slug, input, key); }
  catch { return { ok: false, message: "Lamaran belum dapat diproses. Silakan coba lagi dengan formulir ini." }; }
}
