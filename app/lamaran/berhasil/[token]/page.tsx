import Link from "next/link";
import { notFound } from "next/navigation";
import { repository } from "@/lib/repositories";
import { formatDateTime } from "@/lib/format/date";
import { SuccessActions } from "@/components/public/success-actions";
export const dynamic = "force-dynamic";
export const metadata = { title: "Lamaran berhasil", robots: { index: false, follow: false }, referrer: "no-referrer" as const };
export default async function Success({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const application = await repository.getApplicationByToken(token);
  if (!application) notFound();
  const vacancy = await repository.getVacancyById(application.vacancyId);
  return <main className="mx-auto max-w-2xl px-6 py-12"><Link href="/" className="no-print text-sm font-semibold text-primary">← Beranda karier</Link><div className="print-card mt-8 rounded-xl border border-border bg-white p-6 shadow-sm sm:p-10"><p className="text-sm font-semibold uppercase tracking-widest text-primary">Erdes Group · Bukti lamaran</p><h1 className="mt-4 text-3xl font-bold">Lamaran berhasil dikirim</h1><p className="mt-3 text-muted">Terima kasih, {application.fullName}. Lamaran Anda untuk {vacancy?.title ?? "posisi ini"} telah kami terima.</p><div className="my-8 rounded-xl bg-blue-50 p-6"><p className="text-sm font-semibold text-primary">Applicant ID</p><p className="mt-2 break-all text-2xl font-bold">{application.id}</p></div><p className="font-semibold">Simpan Applicant ID ini. Kami tidak mengirimkannya melalui email.</p><p className="mt-3 text-sm text-muted">Tanggal lamaran: {formatDateTime(application.appliedAt)}</p><SuccessActions id={application.id} token={token} /></div></main>;
}
