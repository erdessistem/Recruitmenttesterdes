import {
  APPLICATION_SOURCE_LABELS,
  APPLICATION_STATUS_LABELS,
  AVAILABILITY_LABELS,
  EDUCATION_LEVEL_LABELS,
  GENDER_LABELS,
  MARITAL_STATUS_LABELS,
  STAGE_LABELS,
  getTimelineLabel,
} from "@/lib/constants";
import { formatDate, formatDateTime } from "@/lib/format/date";
import { compareToRange, formatRupiah, formatSalaryRange } from "@/lib/format/currency";
import { formatWhatsAppDisplay } from "@/lib/format/phone";
import { answerLabel, isMismatch } from "@/lib/public/screening";
import type { Application, Settings, StageHistoryEntry, Vacancy } from "@/lib/repositories/types";

/** One labelled value. `wide` fields take the full row instead of half. */
export interface PdfField {
  label: string;
  value: string;
  wide?: boolean;
  note?: string;
}

export interface PdfSection {
  title: string;
  fields: PdfField[];
}

export interface ApplicantPdfModel {
  company: string;
  fileName: string;
  name: string;
  position: string;
  positionDetail: string;
  meta: Array<[string, string]>;
  anonymizedNotice: string | null;
  sections: PdfSection[];
  screening: Array<{ question: string; answer: string; flag: string | null }>;
  motivation: string;
  history: Array<{ at: string; event: string; by: string }>;
  consent: string;
  printed: string;
}

const FIT_LABELS = {
  below: "di bawah rentang lowongan",
  within: "sesuai rentang lowongan",
  above: "di atas rentang lowongan",
} as const;

const dash = (value: string | null | undefined) => (value && value.trim() ? value.trim() : "—");

function person(name: string, phone: string, detail?: string) {
  if (!name && !phone) return "—";
  const who = detail ? `${name || "—"} (${detail})` : name || "—";
  return phone ? `${who}\n${formatWhatsAppDisplay(phone)}` : who;
}

/** Safe for a download name: letters, digits and hyphens only. */
export function pdfFileName(id: string): string {
  const safe = id.replace(/[^A-Za-z0-9-]/g, "").slice(0, 120);
  return `Formulir-Lamaran-${safe || "pelamar"}.pdf`;
}

/**
 * Everything the applicant PDF shows, already formatted. Internal notes are never
 * included, matching the CSV rule; stage history lists moves without their notes.
 */
export function applicantPdfModel(input: {
  application: Application;
  vacancy: Vacancy | null;
  history: StageHistoryEntry[];
  settings: Settings;
  printedBy: string;
  now?: Date;
}): ApplicantPdfModel {
  const { application: a, vacancy, history, settings, printedBy, now = new Date() } = input;

  const experience =
    a.experienceYears === 0 ? "Belum pernah bekerja" : `${a.experienceYears} tahun`;
  const range = vacancy ? formatSalaryRange(vacancy.salaryMin, vacancy.salaryMax) : null;
  const fit = vacancy ? compareToRange(a.expectedSalary, vacancy.salaryMin, vacancy.salaryMax) : null;
  const status =
    a.status === "active" ? STAGE_LABELS[a.currentStage] : APPLICATION_STATUS_LABELS[a.status];

  const sections: PdfSection[] = [
    {
      title: "Data pribadi",
      fields: [
        { label: "Nama lengkap", value: dash(a.fullName) },
        { label: "Nomor WhatsApp", value: a.whatsapp ? formatWhatsAppDisplay(a.whatsapp) : "—" },
        { label: "Email", value: dash(a.email) },
        { label: "Mulai bekerja", value: AVAILABILITY_LABELS[a.availability] ?? "—" },
        { label: "Alamat domisili", value: dash(a.city), wide: true },
        {
          label: "Tempat, tanggal lahir",
          value: dash(
            [a.birthPlace, a.birthDate ? formatDate(a.birthDate) : ""].filter(Boolean).join(", "),
          ),
        },
        { label: "Jenis kelamin", value: a.gender ? GENDER_LABELS[a.gender] : "—" },
        {
          label: "Status pernikahan",
          value: a.maritalStatus ? MARITAL_STATUS_LABELS[a.maritalStatus] : "—",
        },
        { label: "Jumlah anak", value: dash(a.childrenCount) },
        { label: "Agama", value: dash(a.religion) },
      ],
    },
    {
      title: "Data orang tua",
      fields: [
        { label: "Nama orang tua", value: dash(a.parentName) },
        { label: "Umur orang tua", value: dash(a.parentAge) },
        { label: "Pekerjaan orang tua", value: dash(a.parentOccupation) },
        { label: "Alamat orang tua", value: dash(a.parentAddress), wide: true },
      ],
    },
    {
      title: "Pendidikan dan pengalaman",
      fields: [
        { label: "Pendidikan terakhir", value: EDUCATION_LEVEL_LABELS[a.lastEducation] ?? "—" },
        { label: "Jurusan", value: dash(a.major) },
        { label: "Perusahaan terakhir", value: dash(a.lastCompany) },
        { label: "Posisi terakhir", value: dash(a.lastPosition) },
        { label: "Pengalaman kerja", value: experience },
        { label: "Alasan berhenti bekerja", value: dash(a.leaveReason), wide: true },
      ],
    },
    {
      title: "Gaji",
      fields: [
        { label: "Gaji terakhir (per bulan)", value: formatRupiah(a.lastSalary) },
        {
          label: "Ekspektasi gaji (per bulan)",
          value: formatRupiah(a.expectedSalary),
          note: range && fit ? `${capitalize(FIT_LABELS[fit])} (${range})` : undefined,
        },
      ],
    },
    {
      title: "Referensi dan kontak darurat",
      fields: [
        { label: "Referensi (atasan sebelumnya)", value: person(a.referenceName, a.referencePhone) },
        {
          label: "Kontak darurat",
          value: person(a.emergencyName, a.emergencyPhone, a.emergencyRelation),
        },
      ],
    },
    {
      title: "Dokumen dan sumber",
      fields: [
        { label: "CV / portfolio", value: dash(a.cvUrl), wide: true },
        { label: "LinkedIn", value: dash(a.linkedinUrl), wide: true },
        {
          label: "Mengetahui lowongan dari",
          value:
            a.source === "other" && a.sourceOther
              ? `${APPLICATION_SOURCE_LABELS[a.source]}: ${a.sourceOther}`
              : (APPLICATION_SOURCE_LABELS[a.source] ?? "—"),
          wide: true,
        },
      ],
    },
    {
      title: "Lain-lain",
      fields: [
        { label: "Hobi / keahlian", value: dash(a.hobbies), wide: true },
        { label: "Prestasi / kejuaraan", value: dash(a.achievements), wide: true },
        { label: "Keterangan lain", value: dash(a.otherNotes), wide: true },
      ],
    },
  ];

  return {
    company: settings.companyProfile.name || "Erdes Group",
    fileName: pdfFileName(a.id),
    name: a.fullName || a.id,
    position: vacancy?.title ?? "Lowongan tidak ditemukan",
    positionDetail: vacancy
      ? [vacancy.department, vacancy.location].filter(Boolean).join(" · ")
      : "",
    meta: [
      ["ID pelamar", a.id],
      ["Tanggal melamar", formatDate(a.appliedAt)],
      ["Status", status],
    ],
    anonymizedNotice: a.anonymizedAt
      ? `Data pribadi pelamar ini telah dianonimkan pada ${formatDate(a.anonymizedAt)}.`
      : null,
    sections,
    screening: a.screeningAnswers.map((answer) => ({
      question: answer.question,
      answer: answerLabel(answer),
      flag: isMismatch(answer)
        ? `Tidak sesuai, diharapkan ${answer.expected === "yes" ? "Ya" : "Tidak"}`
        : null,
    })),
    motivation: dash(a.motivation),
    history: [...history]
      .sort((x, y) => new Date(x.changedAt).getTime() - new Date(y.changedAt).getTime())
      .map((event) => ({
        at: formatDateTime(event.changedAt),
        event: getTimelineLabel(event),
        by: event.changedBy,
      })),
    consent: a.consent
      ? `Pelamar menyetujui pemrosesan data pribadi pada ${formatDateTime(a.consentAt)} (kebijakan privasi versi ${dash(a.privacyVersion)}).`
      : "Pelamar tidak tercatat memberikan persetujuan pemrosesan data pribadi.",
    printed: `Dicetak ${formatDateTime(now)} oleh ${printedBy}`,
  };
}

function capitalize(text: string) {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

/**
 * The embedded font only has Latin glyphs. Characters outside it are reduced to
 * their base letter where possible ("ş" → "s") and dropped otherwise (emoji),
 * so the PDF never shows empty boxes.
 */
export function pdfSafeText(text: string): string {
  let out = "";
  for (const char of text) {
    if (isSupported(char)) {
      out += char;
      continue;
    }
    const base = char.normalize("NFKD").replace(/\p{M}/gu, "");
    if ([...base].every(isSupported)) out += base;
  }
  return out;
}

function isSupported(char: string) {
  const code = char.codePointAt(0) ?? 0;
  return (
    code <= 0xff ||
    code === 0x131 ||
    code === 0x152 ||
    code === 0x153 ||
    code === 0x2c6 ||
    code === 0x2dc ||
    (code >= 0x2000 && code <= 0x206f) ||
    code === 0x20ac ||
    code === 0x2122 ||
    code === 0x2212
  );
}
