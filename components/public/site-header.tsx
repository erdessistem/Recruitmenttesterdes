import Image from "next/image";
import Link from "next/link";

export function SiteHeader() {
  return (
    <header className="no-print border-b border-border bg-surface">
      <nav
        aria-label="Navigasi utama"
        className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4 sm:px-6"
      >
        <Link href="/" className="flex items-center gap-2.5" aria-label="PT. Erdes, Karier">
          <Image src="/logo.png" alt="PT. Erdes - Desa Maju Bersama" width={852} height={624} priority className="h-14 w-auto sm:h-16" />
          <span className="hidden border-l border-border pl-2.5 text-sm font-medium text-muted sm:inline">Karier</span>
        </Link>
        <div className="flex items-center gap-1 whitespace-nowrap text-sm font-semibold sm:gap-2">
          <Link
            href="/#lowongan"
            className="hidden rounded-control px-3 py-2 hover:bg-paper sm:inline-block"
          >
            Lowongan
          </Link>
          <Link
            href="/lacak"
            className="rounded-control border border-border px-3 py-2 hover:bg-paper"
          >
            Lacak lamaran
          </Link>
        </div>
      </nav>
    </header>
  );
}
