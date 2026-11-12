import { BackLink } from "@/components/ui/back-link";
import { RecoveryForm } from "@/components/public/tracking-forms";
export const metadata = { title: "Cari Applicant ID" };
export default function RecoveryPage() {
  return (
    <main className="mx-auto max-w-xl px-4 py-8 sm:px-6 sm:py-12">
      <BackLink href="/lacak">Lacak lamaran</BackLink>
      <div className="mt-6 rounded-panel border border-border bg-surface p-6 sm:p-10">
        <h1 className="text-h1">Cari Applicant ID</h1>
        <p className="mt-3 text-muted">
          Masukkan nama lengkap dan nomor WhatsApp yang digunakan saat melamar.
        </p>
        <RecoveryForm />
      </div>
    </main>
  );
}
