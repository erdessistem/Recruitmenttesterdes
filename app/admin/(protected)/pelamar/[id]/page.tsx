import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft, ChevronRight, ExternalLink } from "lucide-react";
import { repository } from "@/lib/repositories";
import {
  APPLICATION_SOURCE_LABELS,
  APPLICATION_STATUS_LABELS,
  AVAILABILITY_LABELS,
  EDUCATION_LEVEL_LABELS,
  STAGES,
  STAGE_LABELS,
  getTimelineLabel,
  type Stage,
} from "@/lib/constants";
import { formatDate, formatDateTime } from "@/lib/format/date";
import { formatRupiah } from "@/lib/format/currency";
import { formatWhatsAppDisplay, toWhatsAppUrl } from "@/lib/format/phone";
import { requireAdmin } from "@/lib/auth/session";
import { createWhatsAppMessage } from "@/lib/admin/templates";
import { applyView, daysSince, neighbours, WAITING_DAYS } from "@/lib/admin/attention";
import { listQuery, toRepositoryFilters, type ApplicantFilters } from "@/lib/admin/filters";
import { env } from "@/lib/env";
import { ActionPanel } from "@/components/admin/action-panel";
import { BackLink } from "@/components/ui/back-link";
import { Badge } from "@/components/ui/badge";
import { buttonClass } from "@/components/ui/button";
import { StageLine } from "@/components/ui/stage-line";
import { cn } from "@/lib/utils";

export const metadata = { title: "Detail pelamar" };

function safeHttps(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === "https:" ? url.href : null;
  } catch {
    return null;
  }
}

/** Removes the optional extra-message placeholder and the blank lines it leaves. */
function cleanMessage(text: string) {
  return text
    .replaceAll("{pesan_tambahan}", "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export default async function ApplicantDetail({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<ApplicantFilters>;
}) {
  await requireAdmin();
  const [{ id }, filters] = await Promise.all([params, searchParams]);
  const data = await repository.getApplicantWorkspace(id, toRepositoryFilters(filters));
  if (!data) notFound();
  const { application, vacancy, history, notes, settings } = data;
  const now = new Date();
  const query = listQuery(filters);
  const place = neighbours(applyView(data.rows, filters.view, now), application.id);
  const detailHref = (target: string) => `/admin/pelamar/${encodeURIComponent(target)}${query}`;

  const messages = Object.fromEntries(
    STAGES.map((stage) => [
      stage,
      cleanMessage(
        createWhatsAppMessage(
          { ...application, currentStage: stage },
          vacancy,
          settings,
          env.NEXT_PUBLIC_APP_URL,
        ),
      ),
    ]),
  ) as Record<Stage, string>;

  const since = history.at(-1)?.changedAt ?? application.appliedAt;
  const days = daysSince(since, now);
  const waiting =
    application.status === "active" && application.currentStage !== "hired" && days >= WAITING_DAYS;
  const whatsapp = toWhatsAppUrl(application.whatsapp);
  const cv = safeHttps(application.cvUrl);
  const linkedin = safeHttps(application.linkedinUrl);

  const experience =
    application.experienceYears === 0
      ? "Belum pernah bekerja"
      : `${application.experienceYears} tahun`;
  const lastJob = [application.lastPosition, application.lastCompany].filter(Boolean).join(" di ");

  const summary: Array<[string, React.ReactNode]> = [
    [
      "Pendidikan",
      [EDUCATION_LEVEL_LABELS[application.lastEducation], application.major]
        .filter(Boolean)
        .join(", "),
    ],
    ["Pengalaman", lastJob ? `${experience}. Terakhir ${lastJob}` : experience],
    [
      "Gaji",
      <>
        {formatRupiah(application.lastSalary)} terakhir,{" "}
        <span className="font-semibold">{formatRupiah(application.expectedSalary)}</span> diharapkan
      </>,
    ],
    ["Mulai kerja", AVAILABILITY_LABELS[application.availability]],
    ["Alamat domisili", application.city || "—"],
  ];

  const contact: Array<[string, React.ReactNode]> = [
    [
      "WhatsApp",
      whatsapp ? (
        <a
          className="text-primary hover:underline"
          href={whatsapp}
          target="_blank"
          rel="noopener noreferrer"
        >
          {formatWhatsAppDisplay(application.whatsapp)}
        </a>
      ) : (
        "—"
      ),
    ],
    [
      "Email",
      application.email ? (
        <a className="text-primary hover:underline" href={`mailto:${application.email}`}>
          {application.email}
        </a>
      ) : (
        "—"
      ),
    ],
  ];

  const timeline = [
    ...history.map((event) => ({
      key: `h-${event.id}`,
      at: event.changedAt,
      kind: "stage" as const,
      title: getTimelineLabel(event),
      by: event.changedBy,
      body: event.note,
      publicNote: Boolean(event.noteIsPublic),
    })),
    ...notes.map((note) => ({
      key: `n-${note.id}`,
      at: note.createdAt,
      kind: "note" as const,
      title: "Catatan internal",
      by: note.authorEmail,
      body: note.body,
      publicNote: false,
    })),
  ].sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime());

  return (
    <div className="mx-auto max-w-6xl pb-24 lg:pb-0">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <BackLink href={`/admin/pelamar${query}`}>
          {query ? "Kembali ke daftar" : "Semua pelamar"}
        </BackLink>
        {place && place.total > 1 && (
          <nav aria-label="Pelamar lain di daftar ini" className="flex items-center gap-1 text-sm">
            {place.previous ? (
              <Link
                href={detailHref(place.previous.id)}
                className={buttonClass("ghost", "min-h-10 px-2.5")}
                aria-label={`Sebelumnya: ${place.previous.fullName || place.previous.id}`}
              >
                <ChevronLeft aria-hidden="true" className="h-5 w-5" />
              </Link>
            ) : (
              <span
                className="inline-flex min-h-10 items-center px-2.5 text-border-strong"
                aria-hidden="true"
              >
                <ChevronLeft className="h-5 w-5" />
              </span>
            )}
            <span className="tabular px-1 text-muted">
              {place.position} dari {place.total}
            </span>
            {place.next ? (
              <Link
                href={detailHref(place.next.id)}
                className={buttonClass("ghost", "min-h-10 px-2.5")}
                aria-label={`Berikutnya: ${place.next.fullName || place.next.id}`}
              >
                <ChevronRight aria-hidden="true" className="h-5 w-5" />
              </Link>
            ) : (
              <span
                className="inline-flex min-h-10 items-center px-2.5 text-border-strong"
                aria-hidden="true"
              >
                <ChevronRight className="h-5 w-5" />
              </span>
            )}
          </nav>
        )}
      </div>

      <div className="mt-4 grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="min-w-0 space-y-6">
          <section className="admin-card">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="min-w-0">
                <h1 className="text-3xl font-bold tracking-tight">
                  {application.fullName || application.id}
                </h1>
                <p className="mt-1 text-muted">
                  {vacancy?.title ?? "Lowongan"}, melamar {formatDate(application.appliedAt)}
                </p>
                <p className="tabular mt-1 break-words text-sm">{application.id}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                {application.status !== "active" && (
                  <Badge tone={application.status === "rejected" ? "danger" : "neutral"}>
                    {APPLICATION_STATUS_LABELS[application.status]}
                  </Badge>
                )}
                {application.status === "active" && (
                  <Badge tone={waiting ? "sinyal" : "rel"}>
                    {days === 0 ? "Masuk tahap ini hari ini" : `${days} hari di tahap ini`}
                  </Badge>
                )}
              </div>
            </div>
            <StageLine
              className="mt-8"
              currentStage={application.currentStage}
              status={application.status}
              history={history}
            />
          </section>

          <section className="admin-card">
            <h2 className="text-lg font-bold">Ringkasan</h2>
            <dl className="mt-3 divide-y divide-border">
              {summary.map(([label, value]) => (
                <div key={label} className="grid gap-1 py-3 sm:grid-cols-[9rem_1fr] sm:gap-4">
                  <dt className="text-sm text-muted">{label}</dt>
                  <dd className="break-words text-sm">{value}</dd>
                </div>
              ))}
            </dl>
            <h3 className="mt-5 text-sm font-semibold">Motivasi melamar</h3>
            <p className="mt-2 max-w-[70ch] whitespace-pre-line text-sm leading-6">
              {application.motivation || "—"}
            </p>
            {(cv || linkedin) && (
              <div className="mt-5 flex flex-wrap gap-2">
                {cv && (
                  <a
                    href={cv}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={buttonClass("secondary")}
                  >
                    CV / portfolio
                    <ExternalLink aria-hidden="true" className="h-4 w-4" />
                  </a>
                )}
                {linkedin && (
                  <a
                    href={linkedin}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={buttonClass("secondary")}
                  >
                    LinkedIn
                    <ExternalLink aria-hidden="true" className="h-4 w-4" />
                  </a>
                )}
              </div>
            )}
          </section>

          <section className="admin-card">
            <h2 className="text-lg font-bold">Kontak dan data lain</h2>
            <dl className="mt-3 divide-y divide-border">
              {[
                ...contact,
                [
                  "Sumber informasi",
                  application.source === "other" && application.sourceOther
                    ? `${APPLICATION_SOURCE_LABELS[application.source]}: ${application.sourceOther}`
                    : APPLICATION_SOURCE_LABELS[application.source],
                ] as [string, React.ReactNode],
                [
                  "Persetujuan data",
                  application.consent
                    ? `${formatDateTime(application.consentAt)}, versi ${application.privacyVersion}`
                    : "Tidak",
                ] as [string, React.ReactNode],
              ].map(([label, value]) => (
                <div key={label} className="grid gap-1 py-3 sm:grid-cols-[9rem_1fr] sm:gap-4">
                  <dt className="text-sm text-muted">{label}</dt>
                  <dd className="break-words text-sm">{value}</dd>
                </div>
              ))}
            </dl>
          </section>

          <section className="admin-card">
            <h2 className="text-lg font-bold">Riwayat dan catatan</h2>
            {timeline.length ? (
              <ol className="mt-4 space-y-4">
                {timeline.map((item) => (
                  <li
                    key={item.key}
                    className={cn(
                      "border-l-2 pl-4",
                      item.kind === "note" ? "border-sinyal" : "border-primary",
                    )}
                  >
                    <p className="text-sm font-semibold">{item.title}</p>
                    <p className="mt-0.5 text-xs text-muted">
                      {formatDateTime(item.at)}, oleh {item.by}
                    </p>
                    {item.body && (
                      <p
                        className={cn(
                          "mt-2 whitespace-pre-line rounded-control p-3 text-sm",
                          item.kind === "note" ? "bg-sinyal-soft" : "bg-paper",
                        )}
                      >
                        {item.publicNote && (
                          <span className="mb-1 block text-xs font-semibold text-primary">
                            Catatan untuk kandidat
                          </span>
                        )}
                        {item.body}
                      </p>
                    )}
                  </li>
                ))}
              </ol>
            ) : (
              <p className="mt-4 text-sm text-muted">Belum ada riwayat.</p>
            )}
          </section>
        </div>

        <ActionPanel
          id={application.id}
          name={application.fullName}
          stage={application.currentStage}
          status={application.status}
          whatsapp={application.whatsapp}
          messages={messages}
        />
      </div>
    </div>
  );
}
