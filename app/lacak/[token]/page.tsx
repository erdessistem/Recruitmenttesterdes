import Link from "next/link";
import { notFound } from "next/navigation";
import { repository } from "@/lib/repositories";
import { APPLICATION_STATUS_LABELS, STAGE_LABELS, getTimelineLabel, getTrackingNextStep } from "@/lib/constants";
import { formatDate, formatDateTime } from "@/lib/format/date";
import { WithdrawalForm } from "@/components/public/tracking-forms";
export const dynamic = "force-dynamic";
export default async function TrackingPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const application = await repository.getApplicationByToken(token);
  if (!application) notFound();
  const [vacancy, history] = await Promise.all([repository.getVacancyById(application.vacancyId), repository.getStageHistory(application.id)]);
  return <main className="mx-auto max-w-3xl px-6 py-12"><Link href="/" className="text-sm font-semibold text-primary">← Beranda karier</Link><div className="mt-8 rounded-xl border border-border bg-white p-6 sm:p-10"><p className="text-sm font-semibold uppercase tracking-widest text-primary">Status rekrutmen</p><h1 className="mt-3 text-3xl font-bold">Lamaran {vacancy?.title ?? "Anda"}</h1><p className="mt-3 text-muted">{application.fullName} · Dilamar {formatDate(application.appliedAt)}</p><div className="mt-7 rounded-xl bg-blue-50 p-5"><p className="text-sm text-primary">Status: {APPLICATION_STATUS_LABELS[application.status]}</p><h2 className="mt-1 text-xl font-bold">{STAGE_LABELS[application.currentStage]}</h2><p className="mt-2 text-sm leading-6">{getTrackingNextStep(application.currentStage, application.status)}</p></div><h2 className="mt-10 text-xl font-bold">Riwayat lamaran</h2><ol className="mt-5 space-y-5 border-l-2 border-border pl-5">{history.map(event => <li key={event.id}><p className="font-semibold">{getTimelineLabel(event)}</p><p className="mt-1 text-sm text-muted">{formatDateTime(event.changedAt)}</p>{event.noteIsPublic === true && event.note && <p className="mt-1 whitespace-pre-line text-sm">{event.note}</p>}</li>)}</ol>{application.status === "active" && application.currentStage !== "hired" && <WithdrawalForm token={token} />}{application.status === "withdrawn" && <p className="mt-8 rounded-control bg-slate-100 p-4 text-sm">Lamaran ini telah ditarik.</p>}</div></main>;
}
