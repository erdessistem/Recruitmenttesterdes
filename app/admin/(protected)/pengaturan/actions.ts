"use server";
import { requireAdmin } from "@/lib/auth/session";
import { repository } from "@/lib/repositories";
import { STAGES, type Stage } from "@/lib/constants";
import { revalidatePath } from "next/cache";
import { compare, hash } from "bcryptjs";
import { z } from "zod";
import { normalizeWhatsApp } from "@/lib/format/phone";
import { setSession } from "@/lib/auth/session";
export async function saveTemplates(form: FormData) {
  await requireAdmin();
  const defaultTemplate = String(form.get("default") ?? "").trim();
  if (!defaultTemplate || defaultTemplate.length > 4000)
    return { ok: false, message: "Template utama wajib diisi (maksimal 4.000 karakter)." };
  const byStage: Partial<Record<Stage, string>> = {};
  for (const stage of STAGES) {
    const text = String(form.get(stage) ?? "").trim();
    if (text.length > 4000)
      return { ok: false, message: "Setiap template maksimal 4.000 karakter." };
    if (text) byStage[stage] = text;
  }
  await repository.updateSettings({ waTemplates: { default: defaultTemplate, byStage } });
  revalidatePath("/admin/pengaturan");
  revalidatePath("/admin/pelamar");
  return { ok: true, message: "Template WhatsApp disimpan." };
}
export async function saveCompany(form: FormData) {
  await requireAdmin();
  const parsed = z
    .object({
      name: z.string().trim().min(2).max(150),
      address: z.string().trim().max(500),
      contactEmail: z.email().max(150),
      contactWhatsapp: z
        .string()
        .trim()
        .refine((value) => !!normalizeWhatsApp(value)),
    })
    .safeParse(Object.fromEntries(form.entries()));
  if (!parsed.success)
    return { ok: false, message: "Periksa nama perusahaan, alamat, email, dan nomor WhatsApp." };
  await repository.updateSettings({
    companyProfile: {
      ...parsed.data,
      contactWhatsapp: normalizeWhatsApp(parsed.data.contactWhatsapp)!,
    },
  });
  revalidatePath("/");
  revalidatePath("/privasi");
  revalidatePath("/admin/pengaturan");
  return { ok: true, message: "Profil perusahaan disimpan." };
}
export async function changePassword(form: FormData) {
  const admin = await requireAdmin();
  const current = String(form.get("current") ?? "");
  const next = String(form.get("password") ?? "");
  const confirmation = String(form.get("confirmation") ?? "");
  if (next.length < 8 || Buffer.byteLength(next, "utf8") > 72 || next !== confirmation)
    return {
      ok: false,
      message: "Password baru harus cocok, minimal 8 karakter dan maksimal 72 byte.",
    };
  if (!(await compare(current, admin.passwordHash)))
    return { ok: false, message: "Password saat ini salah." };
  const updated = await repository.updateAdminPassword(admin.email, await hash(next, 12));
  await setSession(updated.email, updated.sessionVersion);
  return { ok: true, message: "Password diubah. Sesi lama telah dinonaktifkan." };
}
export async function runRetention(confirmation: string) {
  await requireAdmin();
  if (confirmation !== "ANONIMKAN")
    return { ok: false, message: "Ketik ANONIMKAN untuk mengonfirmasi." };
  try {
    const settings = await repository.getSettings();
    const result = await repository.anonymizeExpiredApplications(settings.retentionMonths);
    revalidatePath("/admin");
    revalidatePath("/admin/pelamar");
    revalidatePath("/admin/pengaturan");
    return { ok: true, message: `${result.count} lamaran berhasil dianonimkan.` };
  } catch {
    return {
      ok: false,
      message: "Pembersihan belum selesai. Periksa data dan cadangan sebelum mencoba lagi.",
    };
  }
}
