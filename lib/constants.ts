/**
 * Shared domain constants and Indonesian UI copy.
 *
 * Slugs are stored in Google Sheets and must stay stable. Labels are UI copy and
 * may be changed during a redesign without touching stored data.
 */

export const COMPANY_NAME = "Erdes Group";
export const APP_NAME = "Karier Erdes Group";
export const PRIVACY_VERSION = "2026-11-02";
export const TIME_ZONE = "Asia/Jakarta";

export const STAGES = [
  "applied",
  "screening",
  "hr_interview",
  "user_interview",
  "offering",
  "hired",
] as const;

export type Stage = (typeof STAGES)[number];

export const STAGE_LABELS: Record<Stage, string> = {
  applied: "Lamaran Masuk",
  screening: "Screening",
  hr_interview: "Interview HR",
  user_interview: "Interview User",
  offering: "Penawaran",
  hired: "Diterima",
};

export const STAGE_DESCRIPTIONS: Record<Stage, string> = {
  applied: "Lamaran telah diterima dan menunggu pemeriksaan awal.",
  screening: "Tim rekrutmen sedang meninjau dokumen dan kualifikasi.",
  hr_interview: "Tahap wawancara dengan tim Human Resources.",
  user_interview: "Tahap wawancara dengan calon atasan atau tim terkait.",
  offering: "Kandidat sedang berada pada tahap penawaran kerja.",
  hired: "Kandidat telah diterima.",
};

export const STAGE_TIMELINE_LABELS: Record<Stage, string> = {
  applied: "Lamaran diterima",
  screening: "Masuk tahap Screening",
  hr_interview: "Interview HR",
  user_interview: "Interview User",
  offering: "Penawaran",
  hired: "Diterima",
};

export const APPLICATION_STATUSES = ["active", "rejected", "withdrawn"] as const;

export type ApplicationStatus = (typeof APPLICATION_STATUSES)[number];

export const APPLICATION_STATUS_LABELS: Record<ApplicationStatus, string> = {
  active: "Aktif",
  rejected: "Ditolak",
  withdrawn: "Mengundurkan diri",
};

export const EMPLOYMENT_TYPES = [
  "full_time",
  "contract",
  "internship",
  "part_time",
] as const;

export type EmploymentType = (typeof EMPLOYMENT_TYPES)[number];

export const EMPLOYMENT_TYPE_LABELS: Record<EmploymentType, string> = {
  full_time: "Penuh Waktu",
  contract: "Kontrak",
  internship: "Magang",
  part_time: "Paruh Waktu",
};

export const VACANCY_STATUSES = ["draft", "open", "closed", "archived"] as const;

export type VacancyStatus = (typeof VACANCY_STATUSES)[number];

export const VACANCY_STATUS_LABELS: Record<VacancyStatus, string> = {
  draft: "Draf",
  open: "Dibuka",
  closed: "Ditutup",
  archived: "Diarsipkan",
};

export const EDUCATION_LEVELS = ["sma_smk", "d3", "s1", "s2", "s3", "other"] as const;

export type EducationLevel = (typeof EDUCATION_LEVELS)[number];

export const EDUCATION_LEVEL_LABELS: Record<EducationLevel, string> = {
  sma_smk: "SMA/SMK",
  d3: "D3",
  s1: "S1",
  s2: "S2",
  s3: "S3",
  other: "Lainnya",
};

export const AVAILABILITIES = [
  "immediately",
  "two_weeks",
  "one_month",
  "more_than_one_month",
] as const;

export type Availability = (typeof AVAILABILITIES)[number];

export const AVAILABILITY_LABELS: Record<Availability, string> = {
  immediately: "Segera",
  two_weeks: "2 minggu",
  one_month: "1 bulan",
  more_than_one_month: "Lebih dari 1 bulan",
};

export const APPLICATION_SOURCES = [
  "instagram",
  "linkedin",
  "referral",
  "website",
  "job_portal",
  "other",
] as const;

export type ApplicationSource = (typeof APPLICATION_SOURCES)[number];

export const APPLICATION_SOURCE_LABELS: Record<ApplicationSource, string> = {
  instagram: "Instagram",
  linkedin: "LinkedIn",
  referral: "Teman/keluarga",
  website: "Website Erdes",
  job_portal: "Job portal",
  other: "Lainnya",
};

export const SOURCE_OTHER = "other" satisfies ApplicationSource;

/** Statuses that leave the active recruitment funnel. */
export const CLOSED_APPLICATION_STATUSES = ["rejected", "withdrawn"] as const;

/** Stage-specific guidance shown on the public tracking page. */
export const NEXT_STEP_MESSAGES: Record<Stage, string> = {
  applied:
    "Lamaran Anda sudah kami terima. Tim rekrutmen akan memeriksa kelengkapan dan kualifikasi Anda.",
  screening:
    "Tim rekrutmen sedang meninjau kualifikasi Anda. Mohon menunggu kabar melalui WhatsApp.",
  hr_interview:
    "Anda berada di tahap Interview HR. Tim rekrutmen akan menghubungi Anda untuk mengatur jadwal.",
  user_interview:
    "Anda berada di tahap Interview User. Siapkan diri dan tunggu informasi jadwal dari tim rekrutmen.",
  offering:
    "Anda berada di tahap Penawaran. Tim rekrutmen akan menghubungi Anda untuk membahas detail penawaran.",
  hired:
    "Selamat, Anda telah diterima. Tim rekrutmen akan menghubungi Anda untuk proses selanjutnya.",
};

/** Status-specific guidance overrides the stage guidance when present. */
export const STATUS_NEXT_STEP_MESSAGES: Partial<Record<ApplicationStatus, string>> = {
  rejected:
    "Lamaran Anda belum dapat dilanjutkan pada proses ini. Terima kasih atas waktu dan minat Anda kepada Erdes Group.",
  withdrawn:
    "Anda telah mengundurkan diri dari proses rekrutmen ini. Tidak ada tindakan lanjutan yang diperlukan.",
};

export function getTrackingNextStep(stage: Stage, status: ApplicationStatus): string {
  return STATUS_NEXT_STEP_MESSAGES[status] ?? NEXT_STEP_MESSAGES[stage];
}

export interface TimelineLabelInput {
  fromStage: Stage | null;
  toStage: Stage;
  fromStatus: ApplicationStatus | null;
  toStatus: ApplicationStatus;
}

/**
 * Returns a public-safe label for a timeline event.
 * Non-sequential or backward stage moves use the neutral "Dipindahkan" label.
 */
export function getTimelineLabel({
  fromStage,
  toStage,
  fromStatus,
  toStatus,
}: TimelineLabelInput): string {
  if (toStatus === "rejected") return "Ditolak";
  if (toStatus === "withdrawn") return "Mengundurkan diri";

  if (
    (fromStatus === "rejected" || fromStatus === "withdrawn") &&
    toStatus === "active"
  ) {
    return "Lamaran dibuka kembali";
  }

  if (!fromStage) return "Lamaran diterima";

  const fromIndex = STAGES.indexOf(fromStage);
  const toIndex = STAGES.indexOf(toStage);

  if (fromIndex >= 0 && toIndex === fromIndex + 1) {
    return STAGE_TIMELINE_LABELS[toStage];
  }

  return `Dipindahkan ke tahap ${STAGE_LABELS[toStage]}`;
}

export const SESSION_COOKIE_NAME = "erdes_session";
export const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 7;

export const MIN_FORM_FILL_SECONDS = 3;
export const MAX_APPLICATION_SUBMISSIONS_PER_HOUR = 3;
export const MAX_TRACKING_LOOKUPS_PER_10_MINUTES = 10;
export const MAX_RECOVERY_ATTEMPTS_PER_15_MINUTES = 5;
export const MAX_LOGIN_ATTEMPTS_PER_15_MINUTES = 5;

/** Admin roles, from most to least access. */
export const ADMIN_ROLES = ["superadmin", "hr", "viewer"] as const;
export type AdminRole = (typeof ADMIN_ROLES)[number];
export const ADMIN_ROLE_LABELS: Record<AdminRole, string> = {
  superadmin: "Superadmin",
  hr: "HR",
  viewer: "Viewer",
};
export const ADMIN_ROLE_DESCRIPTIONS: Record<AdminRole, string> = {
  superadmin: "Semua akses, termasuk akun admin, pengaturan, dan retensi data.",
  hr: "Mengelola lowongan dan pelamar. Tanpa pengaturan dan akun.",
  viewer: "Hanya melihat dashboard, pelamar, dan laporan.",
};
