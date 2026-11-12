import { BackLink } from "@/components/ui/back-link";
import { repository } from "@/lib/repositories";
export const dynamic = "force-dynamic";
export const metadata = { title: "Kebijakan privasi" };
export default async function Privacy() {
  const settings = await repository.getSettings();
  return (
    <main className="mx-auto max-w-3xl px-4 py-8 sm:px-6 sm:py-12">
      <BackLink href="/">Beranda karier</BackLink>
      <article className="mt-6 rounded-panel border border-border bg-surface p-6 sm:p-10">
        <h1 className="text-h1">Kebijakan privasi rekrutmen</h1>
        <p className="mt-2 text-sm text-muted">Versi {settings.privacyVersion}</p>
        <div className="mt-8 max-w-[70ch] space-y-5 leading-7">
          <p>
            Erdes Group menggunakan data yang Anda berikan untuk menilai lamaran, menghubungi Anda,
            dan menjalankan proses rekrutmen. Email dan tautan CV bersifat opsional.
          </p>
          <p>
            Data hanya dapat diakses oleh pihak yang berwenang dalam proses rekrutmen. Simpan
            Applicant ID dan link lacak pribadi Anda dengan aman. Link tersebut dapat memberikan
            akses ke status lamaran; akses ke catatan infrastruktur dibatasi.
          </p>
          <p>
            Untuk membantu pemulihan Applicant ID, nomor WhatsApp dan nama lengkap yang sesuai
            digunakan sebagai bukti identitas. Data lamaran yang telah ditutup disimpan sesuai
            kebijakan retensi {settings.retentionMonths} bulan, kemudian dianonimkan. Salinan
            cadangan dan riwayat versi mungkin masih menyimpan data untuk sementara.
          </p>
          <p>Untuk pertanyaan tentang data Anda, hubungi {settings.companyProfile.contactEmail}.</p>
        </div>
      </article>
    </main>
  );
}
