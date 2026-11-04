import Link from "next/link";
import { RecoveryForm } from "@/components/public/tracking-forms";
export default function RecoveryPage() {
  return (
    <main className="mx-auto max-w-2xl px-6 py-12">
      <Link href="/lacak" className="text-sm font-semibold text-primary">
        ← Lacak lamaran
      </Link>
      <div className="mt-8 rounded-xl border border-border bg-white p-6 sm:p-10">
        <h1 className="text-3xl font-bold">Cari Applicant ID</h1>
        <p className="mt-3 text-muted">
          Masukkan nama lengkap dan nomor WhatsApp yang digunakan saat melamar.
        </p>
        <RecoveryForm />
      </div>
    </main>
  );
}
