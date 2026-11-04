import Link from "next/link";

/** Wordmark is text until the Erdes Group logo is supplied. */
export function SiteHeader() {
  return (
    <header className="no-print border-b border-border bg-surface">
      <nav
        aria-label="Navigasi utama"
        className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4 sm:px-6"
      >
        <Link href="/" className="flex items-center gap-2.5 font-bold tracking-tight">
          <span aria-hidden="true" className="flex items-center gap-[3px]">
            <span className="h-2.5 w-2.5 rounded-full bg-primary" />
            <span className="h-1 w-3 rounded-full bg-primary" />
            <span className="h-2.5 w-2.5 rounded-full border-2 border-primary" />
          </span>
          <span className="whitespace-nowrap">
            Erdes Group <span className="hidden font-medium text-muted sm:inline">Karier</span>
          </span>
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
