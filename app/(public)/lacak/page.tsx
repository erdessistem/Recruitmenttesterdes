import Link from "next/link";
import { LookupForm } from "@/components/public/tracking-forms";
export default function TrackingPage() {
  return (
    <main className="mx-auto max-w-2xl px-6 py-12">
      <Link href="/" className="text-sm font-semibold text-primary">
        ← Beranda karier
      </Link>
      <div className="mt-8 rounded-xl border border-border bg-white p-6 sm:p-10">
        <p className="text-sm font-semibold uppercase tracking-widest text-primary">
          Status rekrutmen
        </p>
        <h1 className="mt-3 text-3xl font-bold">Lacak lamaran</h1>
        <p className="mt-3 text-muted">
          Masukkan Applicant ID dan nomor WhatsApp yang digunakan saat melamar.
        </p>
        <LookupForm />
        <p className="mt-6 text-sm text-muted">
          Lupa Applicant ID?{" "}
          <Link href="/lacak/cari" className="font-semibold text-primary underline">
            Cari Applicant ID
          </Link>
        </p>
      </div>
    </main>
  );
}
