import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="no-print mt-auto border-t border-border bg-surface">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-4 py-8 text-sm text-muted sm:px-6">
        <span>© Erdes Group</span>
        <nav aria-label="Tautan footer" className="flex flex-wrap gap-x-5 gap-y-2">
          <Link href="/lacak" className="hover:text-foreground">
            Lacak lamaran
          </Link>
          <Link href="/privasi" className="hover:text-foreground">
            Kebijakan privasi
          </Link>
          <Link href="/admin/login" className="hover:text-foreground">
            Masuk admin
          </Link>
        </nav>
      </div>
    </footer>
  );
}
