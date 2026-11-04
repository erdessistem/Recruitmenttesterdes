import { describe, expect, it } from "vitest";
import { compare } from "bcryptjs";
import { signSession, verifySession } from "@/lib/auth/token";
import { authorizeSession } from "@/lib/auth/authorization";
import { MemoryRepository } from "@/lib/repositories/memory";
import { SEED_ADMIN_EMAIL, SEED_ADMIN_PASSWORD } from "@/lib/repositories/seed";
import { vacancyFormSchema } from "@/lib/validation/vacancy";

describe("admin foundation", () => {
  it("authenticates the offline seed and invalidates old sessions on password change", async () => {
    const repo = new MemoryRepository();
    const admin = await repo.getAdminByEmail(SEED_ADMIN_EMAIL);
    expect(await compare(SEED_ADMIN_PASSWORD, admin!.passwordHash)).toBe(true);
    const token = await signSession({ email: admin!.email, version: admin!.sessionVersion });
    expect((await authorizeSession(repo, token))?.id).toBe(admin!.id);
    expect(await verifySession(token + "modified")).toBeNull();
    await repo.updateAdminPassword(admin!.email, "new-hash");
    expect(await authorizeSession(repo, token)).toBeNull();
  });
  it("validates position codes and keeps vacancy slugs unique", async () => {
    const repo = new MemoryRepository();
    const vacancy = (await repo.getVacancies())[0];
    await expect(repo.createVacancy({ ...vacancy, slug: vacancy.slug })).rejects.toThrow();
    const form = { title: "Admin", slug: "admin", position_code: "!!!", department: "Operasional", location: "Jakarta", employment_type: "full_time", description: "Deskripsi lengkap", requirements: "Persyaratan lengkap", quota: "2", open_at: "", close_at: "", status: "draft" };
    expect(vacancyFormSchema.safeParse(form).success).toBe(false);
  });
  it("creates a vacancy and changes its visibility without deleting it", async () => {
    const repo = new MemoryRepository();
    const vacancy = await repo.createVacancy({ title: "Analis Data", slug: "analis-data", positionCode: "AnalisData", department: "Teknologi", location: "Jakarta", employmentType: "full_time", description: "Deskripsi pekerjaan", requirements: "Persyaratan pekerjaan", quota: 1, openAt: null, closeAt: null, status: "draft" });
    expect((await repo.getOpenVacancies()).some(v => v.id === vacancy.id)).toBe(false);
    await repo.updateVacancy(vacancy.id, { status: "open" });
    expect((await repo.getOpenVacancies()).some(v => v.id === vacancy.id)).toBe(true);
    await repo.updateVacancy(vacancy.id, { status: "closed" });
    expect((await repo.getOpenVacancies()).some(v => v.id === vacancy.id)).toBe(false);
    await repo.updateVacancy(vacancy.id, { status: "archived" });
    expect((await repo.getVacancyById(vacancy.id))?.status).toBe("archived");
  });
});
