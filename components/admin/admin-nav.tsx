"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { BarChart3, Briefcase, LayoutDashboard, Settings, Users } from "lucide-react";
import type { AdminRole } from "@/lib/constants";
import { cn } from "@/lib/utils";

const items = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { href: "/admin/lowongan", label: "Lowongan", icon: Briefcase },
  { href: "/admin/pelamar", label: "Pelamar", icon: Users },
  { href: "/admin/laporan", label: "Laporan", icon: BarChart3 },
  { href: "/admin/pengaturan", label: "Pengaturan", icon: Settings },
];

export function AdminNav({ role }: { role: AdminRole }) {
  const pathname = usePathname();
  return (
    <nav aria-label="Navigasi admin" className="mt-6 flex flex-wrap gap-1 md:flex-col">
      {items.map(({ href, label: baseLabel, icon: Icon, exact }) => {
        // Non-superadmins only see their own password there.
        const label =
          href === "/admin/pengaturan" && role !== "superadmin" ? "Akun saya" : baseLabel;
        const active = exact ? pathname === href : pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex items-center gap-2.5 rounded-control px-3 py-2 text-sm font-medium transition-colors motion-reduce:transition-none",
              active ? "bg-white/12 text-white" : "text-white/70 hover:bg-white/8 hover:text-white",
            )}
          >
            <Icon aria-hidden="true" className="h-4 w-4" strokeWidth={2} />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
