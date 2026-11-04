import Link from "next/link";
import { requireAdmin } from "@/lib/auth/session";
import { logout } from "@/app/admin/actions";
export const dynamic = "force-dynamic";
export const metadata = { robots: { index: false, follow: false } };
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const admin = await requireAdmin();
  return <div className="min-h-screen md:flex"><aside className="no-print bg-slate-900 px-6 py-5 text-white md:min-h-screen md:w-60 md:shrink-0"><Link href="/admin" className="font-bold tracking-wide">ERDES GROUP <span className="text-xs text-slate-300">ADMIN</span></Link><nav aria-label="Navigasi admin" className="mt-6 flex flex-wrap gap-2 md:flex-col"><Link className="rounded px-3 py-2 hover:bg-slate-700" href="/admin">Dashboard</Link><Link className="rounded px-3 py-2 hover:bg-slate-700" href="/admin/lowongan">Lowongan</Link><Link className="rounded px-3 py-2 hover:bg-slate-700" href="/admin/pelamar">Pelamar</Link><Link className="rounded px-3 py-2 hover:bg-slate-700" href="/admin/pengaturan">Template WhatsApp</Link></nav><div className="mt-6 border-t border-slate-700 pt-4 text-sm text-slate-300"><p className="break-all">{admin.name}</p><form action={logout}><button className="mt-3 underline">Keluar</button></form></div></aside><main className="min-w-0 flex-1 px-5 py-8 sm:px-8 lg:px-12">{children}</main></div>;
}
