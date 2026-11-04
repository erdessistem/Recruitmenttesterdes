import { notFound } from "next/navigation";
import { repository } from "@/lib/repositories";
import { formatDateTime } from "@/lib/format/date";
import { SuccessActions } from "@/components/public/success-actions";
import { StageLine } from "@/components/ui/stage-line";
import { ScamNotice } from "@/components/public/scam-notice";
import { formatWhatsAppDisplay } from "@/lib/format/phone";
export const dynamic = "force-dynamic";
export const metadata = {
  title: "Lamaran terkirim",
  robots: { index: false, follow: false },
  referrer: "no-referrer" as const,
};
export default async function Success({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const data = await repository.getTrackingPageData(token);
  if (!data) notFound();
  const { application, vacancy, history, companyProfile } = data;
  return (
    <main className="mx-auto max-w-3xl px-4 py-8 sm:px-6 sm:py-12">
      <div className="print-card rounded-panel border border-border bg-surface p-6 sm:p-10">
        <p className="hidden text-sm font-semibold print:block">Erdes Group, bukti lamaran</p>
        <h1 className="text-3xl font-bold tracking-tight">Lamaran terkirim</h1>
        <p className="mt-3 max-w-[60ch] leading-relaxed text-muted">
          Terima kasih, {application.fullName}. Lamaran Anda untuk{" "}
          <span className="font-semibold text-foreground">{vacancy?.title ?? "posisi ini"}</span>{" "}
          sudah kami terima pada {formatDateTime(application.appliedAt)}.
        </p>

        <div className="mt-8 rounded-panel border-2 border-sinyal bg-sinyal-soft p-5 sm:p-6">
          <p className="text-sm font-semibold text-sinyal-ink">Applicant ID Anda</p>
          <p className="tabular mt-1 break-words text-2xl font-bold sm:text-3xl">
            {application.id}
          </p>
          <p className="mt-3 text-sm text-sinyal-ink">
            Simpan ID ini. Kami tidak mengirimkannya lewat email, dan Anda membutuhkannya untuk
            melacak lamaran.
          </p>
        </div>

        <h2 className="mt-10 text-lg font-bold">Perjalanan lamaran Anda</h2>
        <StageLine
          className="mt-5"
          currentStage={application.currentStage}
          status={application.status}
          history={history}
          animate
        />

        <h2 className="mt-10 text-lg font-bold">Apa selanjutnya</h2>
        <ul className="mt-4 space-y-3 text-sm leading-6">
          <li className="flex gap-3">
            <span aria-hidden="true" className="mt-2 h-2 w-2 shrink-0 rounded-full bg-primary" />
            <span>
              Simpan Applicant ID dan link lacak di bawah. Anda membutuhkan keduanya untuk melihat
              status lamaran.
            </span>
          </li>
          <li className="flex gap-3">
            <span aria-hidden="true" className="mt-2 h-2 w-2 shrink-0 rounded-full bg-primary" />
            <span>
              Tim rekrutmen meninjau lamaran Anda. Tahap terbaru selalu tampil di halaman lacak.
            </span>
          </li>
          <li className="flex gap-3">
            <span aria-hidden="true" className="mt-2 h-2 w-2 shrink-0 rounded-full bg-primary" />
            <span>
              Jika Anda lanjut ke tahap berikutnya, kami menghubungi Anda lewat WhatsApp di{" "}
              <span className="tabular font-semibold">
                {formatWhatsAppDisplay(application.whatsapp)}
              </span>
              .
            </span>
          </li>
        </ul>
        <ScamNotice className="no-print mt-6" whatsapp={companyProfile.contactWhatsapp} />

        <SuccessActions id={application.id} token={token} />
      </div>
    </main>
  );
}
