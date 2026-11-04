"use server";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { compare } from "bcryptjs";
import { createHash } from "node:crypto";
import { repository } from "@/lib/repositories";
import { clearSession, setSession } from "@/lib/auth/session";

const shared = globalThis as typeof globalThis & { __loginFailures?: Map<string, number[]> };
const failures = (shared.__loginFailures ??= new Map<string, number[]>());
const dummyHash = "$2b$12$oJZ2OL5zkL1QpirwS42wTuzv4okjGmm0Kc24fZ.1hCRzdaqLF/V/y";
export async function login(_previous: string, form: FormData): Promise<string> {
  const email = String(form.get("email") ?? "")
    .trim()
    .toLowerCase()
    .slice(0, 254);
  const password = String(form.get("password") ?? "").slice(0, 1024);
  const h = await headers();
  const ip = process.env.VERCEL
    ? (h.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown")
    : "local";
  const key = createHash("sha256").update(`${ip}\0${email}`).digest("hex");
  const now = Date.now();
  for (const [id, times] of failures)
    if (!times.some((time) => time > now - 900_000)) failures.delete(id);
  const attempts = (failures.get(key) ?? []).filter((time) => time > now - 900_000);
  if (attempts.length >= 5) return "Terlalu banyak percobaan. Coba lagi dalam 15 menit.";
  const admin = await repository.getAdminByEmail(email);
  const valid = await compare(password, admin?.passwordHash ?? dummyHash);
  if (!admin || !admin.active || admin.role !== "superadmin" || !valid) {
    attempts.push(now);
    failures.set(key, attempts);
    return "Email atau password salah.";
  }
  failures.delete(key);
  await repository.recordAdminLogin(admin.email);
  await setSession(admin.email, admin.sessionVersion);
  redirect("/admin");
}
export async function logout() {
  await clearSession();
  redirect("/admin/login");
}
