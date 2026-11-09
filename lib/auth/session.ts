import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { SESSION_COOKIE_NAME, SESSION_MAX_AGE_SECONDS } from "@/lib/constants";
import { repository } from "@/lib/repositories";
import { signSession } from "./token";
import { authorizeSession } from "./authorization";
import { hasRole } from "./roles";
import type { AdminRole } from "@/lib/constants";

export async function setSession(email: string, version: number) {
  const token = await signSession({ email, version });
  (await cookies()).set(SESSION_COOKIE_NAME, token, { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/", maxAge: SESSION_MAX_AGE_SECONDS });
}
export async function clearSession() { (await cookies()).delete(SESSION_COOKIE_NAME); }
export async function getSessionAdmin() {
  const token = (await cookies()).get(SESSION_COOKIE_NAME)?.value;
  if (!token) return null;
  return authorizeSession(repository, token);
}
export async function requireAdmin() { const admin = await getSessionAdmin(); if (!admin) redirect("/admin/login"); return admin; }

/** For pages: sends admins without enough access back to the dashboard. */
export async function requireRole(minimum: AdminRole) {
  const admin = await requireAdmin();
  if (!hasRole(admin.role, minimum)) redirect("/admin");
  return admin;
}

/** For server actions: throws instead of redirecting, so the caller sees a clear message. */
export async function requireActionRole(minimum: AdminRole) {
  const admin = await requireAdmin();
  if (!hasRole(admin.role, minimum)) throw new Error("Akun Anda tidak memiliki akses untuk tindakan ini.");
  return admin;
}
