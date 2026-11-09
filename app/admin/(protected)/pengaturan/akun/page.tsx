import { repository } from "@/lib/repositories";
import { requireRole } from "@/lib/auth/session";
import { AdminAccounts } from "@/components/admin/admin-accounts";
import { BackLink } from "@/components/ui/back-link";

export const metadata = { title: "Akun admin" };

export default async function AdminAccountsPage() {
  const me = await requireRole("superadmin");
  const admins = await repository.getAdmins();
  return (
    <div className="mx-auto max-w-5xl">
      <BackLink href="/admin/pengaturan">Pengaturan</BackLink>
      <h1 className="mt-4 text-3xl font-bold tracking-tight">Akun admin</h1>
      <p className="mt-2 max-w-[65ch] text-muted">
        Tambahkan akun untuk tim HR atau atasan. Setiap perubahan tahap tercatat dengan email akun
        yang melakukannya.
      </p>
      {/* Only safe fields go to the browser: never the password hash. */}
      <AdminAccounts
        accounts={admins.map((admin) => ({
          id: admin.id,
          name: admin.name,
          email: admin.email,
          role: admin.role,
          active: admin.active,
          lastLoginAt: admin.lastLoginAt,
          self: admin.id === me.id,
        }))}
      />
    </div>
  );
}
