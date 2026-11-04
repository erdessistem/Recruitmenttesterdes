import { buttonClass } from "@/components/ui/button";
import Link from "next/link";

/** Shared 404 body: closed vacancy, expired tracking link or a mistyped URL. */
export function NotFoundContent() {
  return (
    <main className="mx-auto max-w-xl px-4 py-16 text-center sm:px-6 sm:py-24">
      <p className="tabular text-sm font-semibold text-primary">404</p>
      <h1 className="mt-2 text-3xl font-bold tracking-tight">Halaman tidak ditemukan</h1>
      <p className="mt-4 leading-relaxed text-muted">
        Lowongan ini mungkin sudah ditutup, atau link yang Anda buka tidak lengkap atau sudah tidak
        berlaku. Jika ini link lacak lamaran, cari lamaran Anda dengan Applicant ID dan nomor
        WhatsApp.
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Link href="/#lowongan" className={buttonClass("primary")}>
          Lihat lowongan terbuka
        </Link>
        <Link href="/lacak" className={buttonClass("secondary")}>
          Lacak lamaran
        </Link>
      </div>
    </main>
  );
}
