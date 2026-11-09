"use server";
import { revalidatePath } from "next/cache";
import { hash } from "bcryptjs";
import { z } from "zod";
import { requireActionRole } from "@/lib/auth/session";
import { isAdminRole } from "@/lib/auth/roles";
import { repository } from "@/lib/repositories";
import { RepositoryError } from "@/lib/repositories/errors";
import type { AdminRole } from "@/lib/constants";

type Result = { ok: boolean; message: string };

function passwordProblem(password: string): string | null {
  if (password.length < 8) return "Password minimal 8 karakter.";
  if (Buffer.byteLength(password, "utf8") > 72) return "Password maksimal 72 byte.";
  return null;
}

function failure(error: unknown): Result {
  return {
    ok: false,
    message:
      error instanceof RepositoryError || error instanceof Error
        ? error.message
        : "Perubahan belum dapat disimpan. Silakan coba lagi.",
  };
}

const newAccount = z.object({
  name: z.string().trim().min(2, { error: "Nama minimal 2 karakter." }).max(100),
  email: z.email({ error: "Email tidak valid." }).trim().toLowerCase().max(254),
  role: z.string().refine(isAdminRole, { error: "Pilih peran." }),
  password: z.string(),
});

export async function addAdminAccount(form: FormData): Promise<Result> {
  try {
    await requireActionRole("superadmin");
    const parsed = newAccount.safeParse(Object.fromEntries(form.entries()));
    if (!parsed.success)
      return { ok: false, message: parsed.error.issues[0]?.message ?? "Periksa data akun." };
    const problem = passwordProblem(parsed.data.password);
    if (problem) return { ok: false, message: problem };
    await repository.addAdmin({
      name: parsed.data.name,
      email: parsed.data.email,
      role: parsed.data.role as AdminRole,
      passwordHash: await hash(parsed.data.password, 12),
    });
    revalidatePath("/admin/pengaturan/akun");
    return {
      ok: true,
      message: `Akun ${parsed.data.email} dibuat. Berikan password sementaranya secara langsung.`,
    };
  } catch (error) {
    return failure(error);
  }
}

export async function updateAdminAccount(
  id: string,
  input: { role?: string; active?: boolean },
): Promise<Result> {
  try {
    const me = await requireActionRole("superadmin");
    if (me.id === id)
      return {
        ok: false,
        message: "Anda tidak dapat mengubah peran atau menonaktifkan akun sendiri.",
      };
    if (input.role !== undefined && !isAdminRole(input.role))
      return { ok: false, message: "Peran tidak valid." };
    const updated = await repository.updateAdmin(id, {
      role: input.role as AdminRole | undefined,
      active: typeof input.active === "boolean" ? input.active : undefined,
    });
    revalidatePath("/admin/pengaturan/akun");
    return {
      ok: true,
      message:
        input.active === false
          ? `${updated.email} dinonaktifkan dan langsung keluar dari semua perangkat.`
          : `${updated.email} diperbarui. Akun tersebut perlu masuk kembali agar peran baru berlaku.`,
    };
  } catch (error) {
    return failure(error);
  }
}

export async function resetAdminPassword(id: string, password: string): Promise<Result> {
  try {
    const me = await requireActionRole("superadmin");
    if (me.id === id)
      return { ok: false, message: "Ubah password Anda sendiri di bagian Ubah password." };
    const problem = passwordProblem(String(password ?? ""));
    if (problem) return { ok: false, message: problem };
    const updated = await repository.updateAdmin(id, { passwordHash: await hash(password, 12) });
    revalidatePath("/admin/pengaturan/akun");
    return {
      ok: true,
      message: `Password ${updated.email} direset. Akun tersebut keluar dari semua perangkat.`,
    };
  } catch (error) {
    return failure(error);
  }
}
