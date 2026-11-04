"use client";
import Link from "next/link";
import { buttonClass } from "@/components/ui/button";

/** Shown when a public page fails, e.g. the spreadsheet is briefly unreachable. */
export default function PublicError({
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  return (
    <main className="mx-auto max-w-xl px-4 py-16 text-center sm:px-6 sm:py-24">
      <h1 className="text-3xl font-bold tracking-tight">Halaman belum dapat dimuat</h1>
      <p className="mt-4 leading-relaxed text-muted">
        Terjadi gangguan saat mengambil data. Coba muat ulang dalam beberapa saat. Jika Anda sedang
        mengisi formulir, isian Anda masih tersimpan di perangkat ini selama tab belum ditutup.
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <button type="button" onClick={() => retry()} className={buttonClass("primary")}>
          Coba lagi
        </button>
        <Link href="/" className={buttonClass("secondary")}>
          Beranda karier
        </Link>
      </div>
    </main>
  );
}
