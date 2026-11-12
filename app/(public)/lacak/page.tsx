import Link from "next/link";
import { BackLink } from "@/components/ui/back-link";
import { LookupForm } from "@/components/public/tracking-forms";
export const metadata = { title: "Lacak lamaran" };
export default function TrackingPage() {
  return (
    <main className="mx-auto max-w-xl px-4 py-8 sm:px-6 sm:py-12">
      <BackLink href="/">Beranda karier</BackLink>
      <div className="mt-6 rounded-panel border border-border bg-surface p-6 sm:p-10">
        <h1 className="text-h1">Lacak lamaran</h1>
        <p className="mt-3 text-muted">
          Masukkan Applicant ID dan nomor WhatsApp yang digunakan saat melamar.
        </p>
        <LookupForm />
        <p className="mt-6 border-t border-border pt-6 text-sm text-muted">
          Lupa Applicant ID?{" "}
          <Link href="/lacak/cari" className="font-semibold text-primary underline">
            Cari Applicant ID
          </Link>
        </p>
      </div>
    </main>
  );
}
