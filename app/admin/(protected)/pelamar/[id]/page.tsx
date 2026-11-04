import Link from "next/link";
import { notFound } from "next/navigation";
import { repository } from "@/lib/repositories";
import {
  APPLICATION_SOURCE_LABELS,
  APPLICATION_STATUS_LABELS,
  AVAILABILITY_LABELS,
  EDUCATION_LEVEL_LABELS,
  STAGE_LABELS,
  getTimelineLabel,
} from "@/lib/constants";
import { formatDateTime } from "@/lib/format/date";
import { formatRupiah } from "@/lib/format/currency";
import { toWhatsAppUrl } from "@/lib/format/phone";
import { requireAdmin } from "@/lib/auth/session";
import { ApplicantWorkflow } from "@/components/admin/applicant-workflow";
import { createWhatsAppMessage } from "@/lib/admin/templates";
import { env } from "@/lib/env";

function safeHttps(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === "https:" ? url.href : null;
  } catch {
    return null;
  }
}
export default async function ApplicantDetail({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const application = await repository.reconcileApplicationStage((await params).id);
  if (!application) notFound();
  const [vacancy, history, notes] = await Promise.all([
    repository.getVacancyById(application.vacancyId),
    repository.getStageHistory(application.id),
    repository.getNotes(application.id),
  ]);
  const settings = await repository.getSettings();
  const messageTemplate = createWhatsAppMessage(
    application,
    vacancy,
    settings,
    env.NEXT_PUBLIC_APP_URL,
  );
  const whatsapp = toWhatsAppUrl(application.whatsapp),
    cv = safeHttps(application.cvUrl),
    linkedin = safeHttps(application.linkedinUrl);
  const fields = [
    ["Applicant ID", application.id],
    [
      "WhatsApp",
      whatsapp ? (
        <a
          className="text-primary underline"
          href={whatsapp}
          target="_blank"
          rel="noopener noreferrer"
        >
          {application.whatsapp}
        </a>
      ) : (
        "—"
      ),
    ],
    ["Email", application.email || "—"],
    ["Kota domisili", application.city || "—"],
    ["Pendidikan terakhir", EDUCATION_LEVEL_LABELS[application.lastEducation]],
    ["Jurusan", application.major || "—"],
    ["Pengalaman", `${application.experienceYears} tahun`],
    ["Perusahaan terakhir", application.lastCompany || "—"],
    ["Gaji terakhir", formatRupiah(application.lastSalary)],
    ["Ekspektasi gaji", formatRupiah(application.expectedSalary)],
    ["Ketersediaan", AVAILABILITY_LABELS[application.availability]],
    [
      "Sumber informasi",
      application.source === "other" && application.sourceOther
        ? `${APPLICATION_SOURCE_LABELS[application.source]}: ${application.sourceOther}`
        : APPLICATION_SOURCE_LABELS[application.source],
    ],
    [
      "Persetujuan",
      application.consent
        ? `${formatDateTime(application.consentAt)} · Versi ${application.privacyVersion}`
        : "Tidak",
    ],
    [
      "CV / portfolio",
      cv ? (
        <a className="text-primary underline" href={cv} target="_blank" rel="noopener noreferrer">
          Buka tautan
        </a>
      ) : (
        "—"
      ),
    ],
    [
      "LinkedIn",
      linkedin ? (
        <a
          className="text-primary underline"
          href={linkedin}
          target="_blank"
          rel="noopener noreferrer"
        >
          Buka tautan
        </a>
      ) : (
        "—"
      ),
    ],
  ] as const;
  return (
    <div className="mx-auto max-w-5xl">
      <Link href="/admin/pelamar" className="text-sm font-semibold text-primary">
        ← Semua pelamar
      </Link>
      <div className="mt-6 flex flex-wrap justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">{application.fullName || application.id}</h1>
          <p className="mt-2 text-muted">
            {vacancy?.title ?? "Lowongan"} · {formatDateTime(application.appliedAt)}
          </p>
        </div>
        <p className="text-sm font-semibold text-primary">
          {STAGE_LABELS[application.currentStage]} · {APPLICATION_STATUS_LABELS[application.status]}
        </p>
      </div>
      <ApplicantWorkflow
        id={application.id}
        stage={application.currentStage}
        status={application.status}
        messageTemplate={messageTemplate}
      />
      <section className="admin-card mt-6">
        <h2 className="text-lg font-bold">Data pelamar</h2>
        <dl className="mt-4 grid gap-x-8 sm:grid-cols-2">
          {fields.map(([label, value]) => (
            <div key={label} className="border-b border-border py-3">
              <dt className="text-xs text-muted">{label}</dt>
              <dd className="mt-1 break-words text-sm">{value}</dd>
            </div>
          ))}
        </dl>
        <h3 className="mt-6 font-semibold">Motivasi melamar</h3>
        <p className="mt-2 whitespace-pre-line text-sm leading-6">
          {application.motivation || "—"}
        </p>
      </section>
      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <section className="admin-card">
          <h2 className="text-lg font-bold">Riwayat tahap</h2>
          <ol className="mt-4 space-y-4">
            {history.map((event) => (
              <li key={event.id} className="border-l-2 border-border pl-4">
                <p className="text-sm font-semibold">{getTimelineLabel(event)}</p>
                <p className="mt-1 text-xs text-muted">
                  {formatDateTime(event.changedAt)} · {event.changedBy}
                </p>
                {event.note && <p className="mt-1 whitespace-pre-line text-sm">{event.note}</p>}
              </li>
            ))}
          </ol>
          {!history.length && <p className="mt-4 text-sm text-muted">Belum ada riwayat.</p>}
        </section>
        <section className="admin-card">
          <h2 className="text-lg font-bold">Catatan internal</h2>
          <ul className="mt-4 space-y-4">
            {notes.map((note) => (
              <li key={note.id} className="rounded-control bg-slate-50 p-3">
                <p className="whitespace-pre-line text-sm">{note.body}</p>
                <p className="mt-2 text-xs text-muted">
                  {note.authorEmail} · {formatDateTime(note.createdAt)}
                </p>
              </li>
            ))}
          </ul>
          {!notes.length && <p className="mt-4 text-sm text-muted">Belum ada catatan.</p>}
        </section>
      </div>
    </div>
  );
}
