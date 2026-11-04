import { notFound } from "next/navigation";
import { repository } from "@/lib/repositories";
import {
  APPLICATION_STATUS_LABELS,
  STAGE_LABELS,
  getTimelineLabel,
  getTrackingNextStep,
} from "@/lib/constants";
import { formatDate, formatDateTime } from "@/lib/format/date";
import { WithdrawalForm } from "@/components/public/tracking-forms";
import { StageLine } from "@/components/ui/stage-line";
import { Badge } from "@/components/ui/badge";
export const dynamic = "force-dynamic";
export const metadata = { title: "Status lamaran" };
export default async function TrackingPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const application = await repository.getApplicationByToken(token);
  if (!application) notFound();
  const [vacancy, history] = await Promise.all([
    repository.getVacancyById(application.vacancyId),
    repository.getStageHistory(application.id),
  ]);
  const statusTone =
    application.status === "rejected"
      ? "danger"
      : application.status === "withdrawn"
        ? "neutral"
        : "rel";
  return (
    <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6 sm:py-12">
      <div className="rounded-panel border border-border bg-surface p-6 sm:p-10">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-sm text-muted">Lamaran {application.fullName} untuk</p>
            <h1 className="mt-1 text-3xl font-bold tracking-tight">
              {vacancy?.title ?? "posisi ini"}
            </h1>
            <p className="mt-2 text-sm text-muted">Dilamar {formatDate(application.appliedAt)}</p>
            <p className="tabular mt-1 break-words text-sm font-medium">{application.id}</p>
          </div>
          <Badge tone={statusTone}>{APPLICATION_STATUS_LABELS[application.status]}</Badge>
        </div>

        <StageLine
          className="mt-10"
          currentStage={application.currentStage}
          status={application.status}
          history={history}
          animate
        />

        <div
          className={
            application.status === "active"
              ? "mt-10 rounded-panel bg-primary-soft p-5"
              : "mt-10 rounded-panel bg-paper p-5"
          }
        >
          <h2 className="font-semibold">
            {application.status === "active"
              ? `Saat ini: ${STAGE_LABELS[application.currentStage]}`
              : "Langkah berikutnya"}
          </h2>
          <p className="mt-1 text-sm leading-6">
            {getTrackingNextStep(application.currentStage, application.status)}
          </p>
        </div>

        <h2 className="mt-10 text-lg font-bold">Riwayat lamaran</h2>
        <ol className="mt-4 divide-y divide-border">
          {[...history].reverse().map((event) => (
            <li key={event.id} className="flex flex-col gap-1 py-3 sm:flex-row sm:gap-6">
              <p className="tabular shrink-0 text-sm text-muted sm:w-52">
                {formatDateTime(event.changedAt)}
              </p>
              <div>
                <p className="font-medium">{getTimelineLabel(event)}</p>
                {event.noteIsPublic === true && event.note && (
                  <p className="mt-1 whitespace-pre-line text-sm text-muted">{event.note}</p>
                )}
              </div>
            </li>
          ))}
        </ol>

        {application.status === "active" && application.currentStage !== "hired" && (
          <WithdrawalForm token={token} />
        )}
      </div>
    </main>
  );
}
