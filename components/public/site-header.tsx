import Link from "next/link";
import { LogoTile } from "@/components/brand/logo-tile";

/** The kit's NavBar: logo tile and name on cream, pill links, no rule underneath. */
export function SiteHeader() {
  return (
    <header className="no-print bg-cream">
      <nav
        aria-label="Navigasi utama"
        className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4 sm:px-6"
      >
        <Link
          href="/"
          className="flex items-center gap-2.5 rounded-control font-display text-h3"
          aria-label="PT. Erdes, Karier"
        >
          <LogoTile label="" />
          <span>Karier</span>
        </Link>
        <div className="flex items-center gap-1 whitespace-nowrap text-sm font-semibold">
          <Link
            href="/#lowongan"
            className="hidden rounded-full px-4 py-2 transition-colors hover:bg-sand motion-reduce:transition-none sm:inline-block"
          >
            Lowongan
          </Link>
          <Link
            href="/lacak"
            className="rounded-full px-4 py-2 ring-[1.5px] ring-inset ring-navy transition-colors hover:bg-sand motion-reduce:transition-none"
          >
            Lacak lamaran
          </Link>
        </div>
      </nav>
    </header>
  );
}
