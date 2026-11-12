import Link from "next/link";

const link = "rounded-full underline-offset-4 hover:underline";

/** New for the web (the kit has no footer yet): one navy line that ends the page. */
export function SiteFooter() {
  return (
    <footer className="on-dark no-print mt-auto bg-navy text-white">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-4 py-8 text-sm sm:px-6">
        <span>© PT Erdes Desa Maju Bersama</span>
        <nav aria-label="Tautan footer" className="flex flex-wrap gap-x-6 gap-y-2 font-medium">
          <Link href="/lacak" className={link}>
            Lacak lamaran
          </Link>
          <Link href="/privasi" className={link}>
            Kebijakan privasi
          </Link>
          <Link href="/admin/login" className={link}>
            Masuk admin
          </Link>
        </nav>
      </div>
    </footer>
  );
}
