import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft, ChevronRight, Download, ExternalLink } from "lucide-react";
import { repository } from "@/lib/repositories";
import {
  APPLICATION_SOURCE_LABELS,
  APPLICATION_STATUS_LABELS,
  AVAILABILITY_LABELS,
  EDUCATION_LEVEL_LABELS,
  GENDER_LABELS,
  MARITAL_STATUS_LABELS,
  STAGES,
  STAGE_LABELS,
  getTimelineLabel,
  type Stage,
} from "@/lib/constants";
import { formatDate, formatDateTime } from "@/lib/format/date";
import { compareToRange, formatRupiah, formatSalaryRange } from "@/lib/format/currency";
import { answerLabel, isMismatch } from "@/lib/public/screening";

const FIT_LABELS = {
  below: "Di bawah rentang",
  within: "Sesuai rentang",
  above: "Di atas rentang",
} as const;
import { formatWhatsAppDisplay, toWhatsAppUrl } from "@/lib/format/phone";
import { requireAdmin } from "@/lib/auth/session";
import { canEdit } from "@/lib/auth/roles";
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
  const admin = await requireAdmin();
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

  const salaryRange = vacancy ? formatSalaryRange(vacancy.salaryMin, vacancy.salaryMax) : null;
  const fit = vacancy
    ? compareToRange(application.expectedSalary, vacancy.salaryMin, vacancy.salaryMax)
    : null;
  const answers = application.screeningAnswers;

  const summary: Array<[string, React.ReactNode]> = [
    [
      "Pendidikan",
      [EDUCATION_LEVEL_LABELS[application.lastEducation], application.major]
        .filter(Boolean)
        .join(", "),
    ],
    ["Pengalaman", lastJob ? `${experience}. Terakhir ${lastJob}` : experience],
    ["Alasan berhenti", application.leaveReason || "-"],
    [
      "Gaji",
      <>
        {formatRupiah(application.lastSalary)} terakhir,{" "}
        <span className="font-semibold">{formatRupiah(application.expectedSalary)}</span> diharapkan
        {salaryRange && fit && (
          <span className="mt-1 flex flex-wrap items-center gap-2 text-muted">
            <Badge tone={fit === "within" ? "rel" : "sinyal"}>{FIT_LABELS[fit]}</Badge>
            Rentang lowongan {salaryRange}
            {!vacancy?.salaryVisible && " (tidak ditampilkan ke pelamar)"}
          </span>
        )}
      </>,
    ],
    ["Mulai kerja", AVAILABILITY_LABELS[application.availability]],
    ["Alamat domisili", application.city || "-"],
  ];

  const profile: Array<[string, string]> = [
    [
      "Tempat, tanggal lahir",
      [application.birthPlace, application.birthDate ? formatDate(application.birthDate) : ""]
        .filter(Boolean)
        .join(", "),
    ],
    ["Jenis kelamin", application.gender ? GENDER_LABELS[application.gender] : ""],
    [
      "Status pernikahan",
      application.maritalStatus ? MARITAL_STATUS_LABELS[application.maritalStatus] : "",
    ],
    ["Jumlah anak", application.childrenCount],
    ["Agama", application.religion],
    ["Nama orang tua", application.parentName],
    ["Umur orang tua", application.parentAge],
    ["Pekerjaan orang tua", application.parentOccupation],
    ["Alamat orang tua", application.parentAddress],
    ["Hobi / keahlian", application.hobbies],
    ["Prestasi / kejuaraan", application.achievements],
    ["Keterangan lain", application.otherNotes],
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
        "-"
      ),
    ],
    [
      "Email",
      application.email ? (
        <a className="text-primary hover:underline" href={`mailto:${application.email}`}>
          {application.email}
        </a>
      ) : (
        "-"
      ),
    ],
    [
      "Referensi (atasan sebelumnya)",
      <PersonContact
        key="reference"
        name={application.referenceName}
        phone={application.referencePhone}
      />,
    ],
    [
      "Kontak darurat",
      <PersonContact
        key="emergency"
        name={application.emergencyName}
        detail={application.emergencyRelation}
        phone={application.emergencyPhone}
      />,
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
                <h1 className="text-h2">
                  {application.fullName || application.id}
                </h1>
                <p className="mt-1 text-muted">
                  {vacancy?.title ?? "Lowongan"}, melamar {formatDate(application.appliedAt)}
                </p>
                <p className="tabular mt-1 break-words text-sm">{application.id}</p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {canEdit(admin.role) && (
                  <a
                    href={`/admin/pelamar/${encodeURIComponent(application.id)}/pdf`}
                    download
                    className={buttonClass("secondary", "min-h-9 px-3 text-sm")}
                  >
                    <Download aria-hidden="true" className="h-4 w-4" />
                    Unduh PDF
                  </a>
                )}
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
            <h2 className="text-h3">Ringkasan</h2>
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
              {application.motivation || "-"}
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
            <h2 className="text-h3">Data pribadi dan keluarga</h2>
            <dl className="mt-3 divide-y divide-border">
              {profile.map(([label, value]) => (
                <div key={label} className="grid gap-1 py-3 sm:grid-cols-[9rem_1fr] sm:gap-4">
                  <dt className="text-sm text-muted">{label}</dt>
                  <dd className="whitespace-pre-line break-words text-sm">{value || "-"}</dd>
                </div>
              ))}
            </dl>
          </section>

          {answers.length > 0 && (
            <section className="admin-card">
              <h2 className="text-h3">Jawaban screening</h2>
              <dl className="mt-3 divide-y divide-border">
                {answers.map((answer) => {
                  const mismatch = isMismatch(answer);
                  return (
                    <div key={answer.questionId} className="py-3">
                      <dt className="text-sm text-muted">{answer.question}</dt>
                      <dd className="mt-1 flex flex-wrap items-center gap-2 text-sm">
                        <span
                          className={cn(
                            "whitespace-pre-line break-words",
                            mismatch && "font-semibold",
                          )}
                        >
                          {answerLabel(answer)}
                        </span>
                        {mismatch && (
                          <Badge tone="danger">
                            Tidak sesuai, diharapkan {answer.expected === "yes" ? "Ya" : "Tidak"}
                          </Badge>
                        )}
                      </dd>
                    </div>
                  );
                })}
              </dl>
            </section>
          )}

          <section className="admin-card">
            <h2 className="text-h3">Kontak dan data lain</h2>
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
            <h2 className="text-h3">Riwayat dan catatan</h2>
            {timeline.length ? (
              <ol className="mt-4 space-y-4">
                {timeline.map((item) => (
                  <li
                    key={item.key}
                    className={cn(
                      "border-l-2 pl-4",
                      item.kind === "note" ? "border-marigold" : "border-navy",
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

        {canEdit(admin.role) ? (
          <ActionPanel
            id={application.id}
            name={application.fullName}
            stage={application.currentStage}
            status={application.status}
            whatsapp={application.whatsapp}
            messages={messages}
          />
        ) : (
          <aside className="admin-card text-sm text-muted lg:sticky lg:top-6">
            <h2 className="text-h3 text-foreground">Mode lihat saja</h2>
            <p className="mt-2">
              Akun Viewer dapat melihat data pelamar, tetapi tidak dapat memindahkan tahap, menolak,
              atau menambah catatan. Hubungi HR untuk perubahan.
            </p>
          </aside>
        )}
      </div>
    </div>
  );
}

/** A name with an optional detail (such as the relationship) and a click-to-chat number. */
function PersonContact({ name, detail, phone }: { name: string; detail?: string; phone: string }) {
  if (!name && !phone) return <>-</>;
  const url = toWhatsAppUrl(phone);
  return (
    <>
      {name || "-"}
      {detail && <span className="text-muted"> ({detail})</span>}
      {phone && (
        <>
          {", "}
          {url ? (
            <a
              className="text-primary hover:underline"
              href={url}
              target="_blank"
              rel="noopener noreferrer"
            >
              {formatWhatsAppDisplay(phone)}
            </a>
          ) : (
            phone
          )}
        </>
      )}
    </>
  );
}
