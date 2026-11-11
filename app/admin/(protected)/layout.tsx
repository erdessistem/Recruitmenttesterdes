import Image from "next/image";
import Link from "next/link";
import { LogOut } from "lucide-react";
import { requireAdmin } from "@/lib/auth/session";
import { logout } from "@/app/admin/actions";
import { AdminNav } from "@/components/admin/admin-nav";
import { ADMIN_ROLE_LABELS } from "@/lib/constants";
export const dynamic = "force-dynamic";
export const metadata = {
  title: { default: "Admin", template: "%s · Admin Erdes" },
  robots: { index: false, follow: false },
};
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const admin = await requireAdmin();
  return (
    <div className="min-h-screen md:flex">
      <aside className="no-print flex flex-col bg-ink px-4 py-5 text-white md:sticky md:top-0 md:h-screen md:w-60 md:shrink-0">
        <Link href="/admin" className="flex items-center gap-2.5 px-3" aria-label="PT. Erdes, Admin">
          <Image src="/logo.png" alt="PT. Erdes" width={852} height={624} className="h-12 w-auto rounded-md bg-white" />
          <span className="text-sm font-medium text-white/60">Admin</span>
        </Link>
        <AdminNav role={admin.role} />
        <div className="mt-6 border-t border-white/10 px-3 pt-4 text-sm text-white/70 md:mt-auto">
          <p className="break-all">{admin.name}</p>
          <p className="text-xs text-white/50">{ADMIN_ROLE_LABELS[admin.role]}</p>
          <form action={logout}>
            <button className="mt-2 inline-flex items-center gap-2 rounded-control py-1 font-medium hover:text-white">
              <LogOut aria-hidden="true" className="h-4 w-4" />
              Keluar
            </button>
          </form>
        </div>
      </aside>
      <main className="min-w-0 flex-1 px-4 py-8 sm:px-8 lg:px-12">{children}</main>
    </div>
  );
}
