import "server-only";

import {
  COMPANY_NAME,
  PRIVACY_VERSION,
} from "@/lib/constants";
import type {
  AdminUser,
  Application,
  InternalNote,
  Settings,
  StageHistoryEntry,
  Vacancy,
} from "@/lib/repositories/types";

export const SEED_ADMIN_EMAIL = "admin@erdesgroup.co.id";
/** Development-only credential for the in-memory repository. Never use in production. */
export const SEED_ADMIN_PASSWORD = "ErdesAdmin#2026";
const SEED_ADMIN_PASSWORD_HASH =
  "$2b$12$oJZ2OL5zkL1QpirwS42wTuzv4okjGmm0Kc24fZ.1hCRzdaqLF/V/y";

export interface SeedData {
  vacancies: Vacancy[];
  applications: Application[];
  stageHistory: StageHistoryEntry[];
  notes: InternalNote[];
  adminUsers: AdminUser[];
  settings: Settings;
}

function daysAgo(now: Date, days: number): string {
  return new Date(now.getTime() - days * 24 * 60 * 60 * 1_000).toISOString();
}

function daysFromNow(now: Date, days: number): string {
  return new Date(now.getTime() + days * 24 * 60 * 60 * 1_000).toISOString();
}

const DEFAULT_WA_TEMPLATE = `Halo {nama}, terima kasih telah melamar posisi {posisi} di Erdes Group.

Status lamaran Anda saat ini: {tahap}.
{pesan_tambahan}

Anda dapat memantau lamaran melalui:
{link_lacak}

Applicant ID: {applicant_id}`;

export function createDefaultSettings(
  overrides: Partial<Settings> = {},
): Settings {
  return {
    schemaVersion: "1.0.0",
    privacyVersion: PRIVACY_VERSION,
    vacancyCounter: 0,
    historyCounter: 0,
    noteCounter: 0,
    companyProfile: {
      name: COMPANY_NAME,
      address: "Jakarta, Indonesia",
      contactEmail: "rekrutmen@erdesgroup.co.id",
      contactWhatsapp: "628214374237",
    },
    waTemplates: {
      default: DEFAULT_WA_TEMPLATE,
    },
    retentionMonths: 12,
    lastPurgeAt: null,
    lastPurgeCount: null,
    ...overrides,
  };
}

export function createEmptySeedData(): SeedData {
  return {
    vacancies: [],
    applications: [],
    stageHistory: [],
    notes: [],
    adminUsers: [],
    settings: createDefaultSettings(),
  };
}

export function createSeedData(now: Date = new Date()): SeedData {
  const createdAt = daysAgo(now, 30);
  const adminEmail = SEED_ADMIN_EMAIL;

  const vacancies: Vacancy[] = [
    {
      id: "VAC-0001",
      slug: "admin",
      title: "Admin",
      positionCode: "Admin",
      department: "Operasional",
      location: "Jakarta Selatan",
      employmentType: "full_time",
      description:
        "Mengelola administrasi operasional kantor, pencatatan dokumen, dan koordinasi dengan berbagai tim.",
      requirements:
        "Minimal pendidikan D3.\nTeliti dan mampu bekerja dengan tenggat waktu.\nMenguasai Microsoft Office.\nBersedia bekerja di Jakarta Selatan.",
      quota: 2,
      openAt: daysAgo(now, 20),
      closeAt: daysFromNow(now, 20),
      status: "open",
      createdAt,
      updatedAt: daysAgo(now, 20),
      salaryMin: 4_500_000,
      salaryMax: 6_000_000,
      salaryVisible: true,
      screeningQuestions: [],
    },
    {
      id: "VAC-0002",
      slug: "guru-matematika",
      title: "Guru Matematika",
      positionCode: "GuruMatematika",
      department: "Pendidikan",
      location: "Depok",
      employmentType: "contract",
      description:
        "Mengajar matematika untuk jenjang sekolah menengah, menyusun materi, dan mengevaluasi hasil belajar siswa.",
      requirements:
        "Minimal pendidikan S1 Pendidikan Matematika atau bidang terkait.\nMemiliki pengalaman mengajar minimal 2 tahun.\nMampu berkomunikasi dengan baik.\nBersedia ditempatkan di Depok.",
      quota: 1,
      openAt: daysAgo(now, 18),
      closeAt: daysFromNow(now, 15),
      status: "open",
      createdAt: daysAgo(now, 25),
      updatedAt: daysAgo(now, 18),
      salaryMin: 5_000_000,
      salaryMax: 7_000_000,
      salaryVisible: false,
      screeningQuestions: [
        { id: "penempatan", text: "Bersedia ditempatkan di Depok?", type: "yes_no", required: true, expected: "yes" },
        { id: "kurikulum", text: "Kurikulum apa yang pernah Anda ajarkan?", type: "text", required: false, expected: null },
      ],
    },
    {
      id: "VAC-0003",
      slug: "staf-keuangan",
      title: "Staf Keuangan",
      positionCode: "StafKeuangan",
      department: "Keuangan",
      location: "Jakarta Pusat",
      employmentType: "full_time",
      description:
        "Mendukung proses pencatatan keuangan, rekonsiliasi, dan penyusunan laporan bulanan.",
      requirements:
        "Minimal pendidikan S1 Akuntansi.\nMemahami dasar akuntansi dan perpajakan.\nTeliti dalam mengolah data.",
      quota: 1,
      openAt: null,
      closeAt: null,
      status: "draft",
      createdAt: daysAgo(now, 10),
      updatedAt: daysAgo(now, 10),
      salaryMin: null,
      salaryMax: null,
      salaryVisible: false,
      screeningQuestions: [],
    },
    {
      id: "VAC-0004",
      slug: "marketing",
      title: "Marketing",
      positionCode: "Marketing",
      department: "Pemasaran",
      location: "Jakarta Barat",
      employmentType: "full_time",
      description:
        "Menyusun dan menjalankan program pemasaran untuk mendukung pertumbuhan layanan perusahaan.",
      requirements:
        "Minimal pendidikan S1.\nMemiliki pengalaman di bidang pemasaran.\nKreatif dan mampu bekerja dalam tim.",
      quota: 1,
      openAt: daysAgo(now, 60),
      closeAt: daysAgo(now, 5),
      status: "closed",
      createdAt: daysAgo(now, 70),
      updatedAt: daysAgo(now, 5),
      salaryMin: null,
      salaryMax: null,
      salaryVisible: false,
      screeningQuestions: [],
    },
  ];

  const applications: Application[] = [
    {
      id: "Admin-BudiSantoso-7K3Q9M",
      token: "c2VlZC1idWRpLXRva2VuLTAwMQ",
      submissionKey: "seed-submission-budi-001",
      vacancyId: "VAC-0001",
      fullName: "Budi Santoso",
      whatsapp: "6281234567890",
      email: "budi.santoso@example.com",
      city: "Jakarta Selatan",
      lastEducation: "s1",
      major: "Manajemen",
      experienceYears: 3,
      lastCompany: "PT Sinar Nusantara",
      lastPosition: "Staf Administrasi",
      screeningAnswers: [],
      referenceName: "Hendra Wijaya",
      referencePhone: "6281300000111",
      emergencyName: "Sri Rahayu",
      emergencyRelation: "Ibu",
      emergencyPhone: "6281900000111",
      lastSalary: 6_500_000,
      expectedSalary: 8_500_000,
      cvUrl: "https://example.com/cv/budi-santoso",
      linkedinUrl: "https://linkedin.com/in/budisantoso",
      motivation:
        "Saya tertarik bergabung dengan Erdes Group karena ingin mengembangkan kemampuan administrasi dan berkontribusi pada proses operasional yang rapi dan efisien.",
      availability: "two_weeks",
      source: "linkedin",
      sourceOther: "",
      consent: true,
      consentAt: daysAgo(now, 3),
      privacyVersion: PRIVACY_VERSION,
      currentStage: "screening",
      status: "active",
      appliedAt: daysAgo(now, 3),
      closedAt: null,
      anonymizedAt: null,
      updatedAt: daysAgo(now, 2),
    },
    {
      id: "GuruMatematika-SitiAminah-2N8P4R",
      token: "c2VlZC1zaXRpLXRva2VuLTAwMg",
      submissionKey: "seed-submission-siti-002",
      vacancyId: "VAC-0002",
      fullName: "Siti Aminah",
      whatsapp: "6289876543210",
      email: "",
      city: "Depok",
      lastEducation: "s1",
      major: "Pendidikan Matematika",
      experienceYears: 5,
      lastCompany: "SMA Harapan Bangsa",
      lastPosition: "Guru Matematika",
      screeningAnswers: [
        { questionId: "penempatan", question: "Bersedia ditempatkan di Depok?", type: "yes_no", answer: "no", expected: "yes" },
        { questionId: "kurikulum", question: "Kurikulum apa yang pernah Anda ajarkan?", type: "text", answer: "Kurikulum Merdeka", expected: null },
      ],
      referenceName: "Hendra Wijaya",
      referencePhone: "6281300000222",
      emergencyName: "Sri Rahayu",
      emergencyRelation: "Ibu",
      emergencyPhone: "6281900000222",
      lastSalary: 7_000_000,
      expectedSalary: 9_000_000,
      cvUrl: "",
      linkedinUrl: "",
      motivation:
        "Saya memiliki pengalaman mengajar matematika selama lima tahun dan ingin melanjutkan karier di lingkungan pendidikan yang mendukung pengembangan siswa.",
      availability: "one_month",
      source: "referral",
      sourceOther: "",
      consent: true,
      consentAt: daysAgo(now, 10),
      privacyVersion: PRIVACY_VERSION,
      currentStage: "hr_interview",
      status: "active",
      appliedAt: daysAgo(now, 10),
      closedAt: null,
      anonymizedAt: null,
      updatedAt: daysAgo(now, 4),
    },
    {
      id: "Admin-RizkyPratama-4M2X8T",
      token: "c2VlZC1yaXpreS10b2tlbi0wMDM",
      submissionKey: "seed-submission-rizky-003",
      vacancyId: "VAC-0001",
      fullName: "Rizky Pratama",
      whatsapp: "6285712345678",
      email: "rizky.pratama@example.com",
      city: "Bekasi",
      lastEducation: "d3",
      major: "Administrasi Perkantoran",
      experienceYears: 1,
      lastCompany: "CV Maju Bersama",
      lastPosition: "Staf Keuangan",
      screeningAnswers: [],
      referenceName: "Hendra Wijaya",
      referencePhone: "6281300000333",
      emergencyName: "Sri Rahayu",
      emergencyRelation: "Ibu",
      emergencyPhone: "6281900000333",
      lastSalary: 4_500_000,
      expectedSalary: 5_500_000,
      cvUrl: "https://example.com/cv/rizky-pratama",
      linkedinUrl: "",
      motivation:
        "Saya ingin memperoleh pengalaman kerja yang lebih luas di bidang administrasi dan siap belajar dengan cepat di Erdes Group.",
      availability: "immediately",
      source: "job_portal",
      sourceOther: "",
      consent: true,
      consentAt: daysAgo(now, 40),
      privacyVersion: PRIVACY_VERSION,
      currentStage: "screening",
      status: "rejected",
      appliedAt: daysAgo(now, 40),
      closedAt: daysAgo(now, 35),
      anonymizedAt: null,
      updatedAt: daysAgo(now, 35),
    },
    {
      id: "GuruMatematika-DewiLestari-9Q5W3E",
      token: "c2VlZC1kZXdpLXRva2VuLTAwNA",
      submissionKey: "seed-submission-dewi-004",
      vacancyId: "VAC-0002",
      fullName: "Dewi Lestari",
      whatsapp: "6281356789012",
      email: "dewi.lestari@example.com",
      city: "Depok",
      lastEducation: "s2",
      major: "Pendidikan Matematika",
      experienceYears: 7,
      lastCompany: "SMP Labschool",
      lastPosition: "Guru Bahasa Inggris",
      screeningAnswers: [],
      referenceName: "Hendra Wijaya",
      referencePhone: "6281300000444",
      emergencyName: "Sri Rahayu",
      emergencyRelation: "Ibu",
      emergencyPhone: "6281900000444",
      lastSalary: 8_000_000,
      expectedSalary: 10_000_000,
      cvUrl: "https://example.com/cv/dewi-lestari",
      linkedinUrl: "https://linkedin.com/in/dewilestari",
      motivation:
        "Saya ingin membawa pengalaman mengajar dan pengembangan kurikulum saya untuk mendukung kualitas pendidikan di Erdes Group.",
      availability: "two_weeks",
      source: "instagram",
      sourceOther: "",
      consent: true,
      consentAt: daysAgo(now, 1),
      privacyVersion: PRIVACY_VERSION,
      currentStage: "applied",
      status: "active",
      appliedAt: daysAgo(now, 1),
      closedAt: null,
      anonymizedAt: null,
      updatedAt: daysAgo(now, 1),
    },
    {
      id: "Admin-AgusSetiawan-6V4K2B",
      token: "c2VlZC1hZ3VzLXRva2VuLTAwNQ",
      submissionKey: "seed-submission-agus-005",
      vacancyId: "VAC-0001",
      fullName: "Agus Setiawan",
      whatsapp: "6287765432109",
      email: "",
      city: "Tangerang",
      lastEducation: "sma_smk",
      major: "",
      experienceYears: 2,
      lastCompany: "PT Karya Abadi",
      lastPosition: "Desainer Grafis",
      screeningAnswers: [],
      referenceName: "Hendra Wijaya",
      referencePhone: "6281300000555",
      emergencyName: "Sri Rahayu",
      emergencyRelation: "Ibu",
      emergencyPhone: "6281900000555",
      lastSalary: 4_000_000,
      expectedSalary: 5_000_000,
      cvUrl: "",
      linkedinUrl: "",
      motivation:
        "Saya ingin mengembangkan karier di bidang administrasi dan siap bekerja dengan disiplin serta bertanggung jawab.",
      availability: "immediately",
      source: "website",
      sourceOther: "",
      consent: true,
      consentAt: daysAgo(now, 70),
      privacyVersion: PRIVACY_VERSION,
      currentStage: "applied",
      status: "withdrawn",
      appliedAt: daysAgo(now, 70),
      closedAt: daysAgo(now, 60),
      anonymizedAt: null,
      updatedAt: daysAgo(now, 60),
    },
  ];

  const stageHistory: StageHistoryEntry[] = [
    {
      id: "HIST-000001",
      applicationId: applications[0].id,
      fromStage: null,
      toStage: "applied",
      fromStatus: null,
      toStatus: "active",
      note: "",
      changedBy: "system",
      changedAt: applications[0].appliedAt,
    },
    {
      id: "HIST-000002",
      applicationId: applications[0].id,
      fromStage: "applied",
      toStage: "screening",
      fromStatus: "active",
      toStatus: "active",
      note: "Dokumen lamaran lengkap.",
      changedBy: adminEmail,
      changedAt: daysAgo(now, 2),
    },
    {
      id: "HIST-000003",
      applicationId: applications[1].id,
      fromStage: null,
      toStage: "applied",
      fromStatus: null,
      toStatus: "active",
      note: "",
      changedBy: "system",
      changedAt: applications[1].appliedAt,
    },
    {
      id: "HIST-000004",
      applicationId: applications[1].id,
      fromStage: "applied",
      toStage: "screening",
      fromStatus: "active",
      toStatus: "active",
      note: "Kualifikasi sesuai.",
      changedBy: adminEmail,
      changedAt: daysAgo(now, 8),
    },
    {
      id: "HIST-000005",
      applicationId: applications[1].id,
      fromStage: "screening",
      toStage: "hr_interview",
      fromStatus: "active",
      toStatus: "active",
      note: "Lanjut ke Interview HR.",
      changedBy: adminEmail,
      changedAt: daysAgo(now, 4),
    },
    {
      id: "HIST-000006",
      applicationId: applications[2].id,
      fromStage: null,
      toStage: "applied",
      fromStatus: null,
      toStatus: "active",
      note: "",
      changedBy: "system",
      changedAt: applications[2].appliedAt,
    },
    {
      id: "HIST-000007",
      applicationId: applications[2].id,
      fromStage: "applied",
      toStage: "screening",
      fromStatus: "active",
      toStatus: "active",
      note: "Dokumen diterima.",
      changedBy: adminEmail,
      changedAt: daysAgo(now, 38),
    },
    {
      id: "HIST-000008",
      applicationId: applications[2].id,
      fromStage: "screening",
      toStage: "screening",
      fromStatus: "active",
      toStatus: "rejected",
      note: "Lamaran tidak dilanjutkan.",
      changedBy: adminEmail,
      changedAt: daysAgo(now, 35),
    },
    {
      id: "HIST-000009",
      applicationId: applications[3].id,
      fromStage: null,
      toStage: "applied",
      fromStatus: null,
      toStatus: "active",
      note: "",
      changedBy: "system",
      changedAt: applications[3].appliedAt,
    },
    {
      id: "HIST-000010",
      applicationId: applications[4].id,
      fromStage: null,
      toStage: "applied",
      fromStatus: null,
      toStatus: "active",
      note: "",
      changedBy: "system",
      changedAt: applications[4].appliedAt,
    },
    {
      id: "HIST-000011",
      applicationId: applications[4].id,
      fromStage: "applied",
      toStage: "applied",
      fromStatus: "active",
      toStatus: "withdrawn",
      note: "Kandidat mengundurkan diri.",
      changedBy: "candidate",
      changedAt: daysAgo(now, 60),
    },
  ];

  const notes: InternalNote[] = [
    {
      id: "NOTE-000001",
      applicationId: applications[0].id,
      authorEmail: adminEmail,
      body: "Pengalaman administrasi relevan. Perlu konfirmasi kesediaan bekerja penuh waktu.",
      createdAt: daysAgo(now, 2),
    },
    {
      id: "NOTE-000002",
      applicationId: applications[0].id,
      authorEmail: adminEmail,
      body: "Jadwalkan Interview HR pada minggu depan.",
      createdAt: daysAgo(now, 1),
    },
  ];

  const adminUsers: AdminUser[] = [
    {
      id: "ADM-0001",
      email: adminEmail,
      name: "Superadmin Erdes",
      passwordHash: SEED_ADMIN_PASSWORD_HASH,
      role: "superadmin",
      active: true,
      sessionVersion: 1,
      createdAt,
      lastLoginAt: null,
    },
  ];

  const settings = createDefaultSettings({
    vacancyCounter: vacancies.length,
    historyCounter: stageHistory.length,
    noteCounter: notes.length,
  });

  return {
    vacancies,
    applications,
    stageHistory,
    notes,
    adminUsers,
    settings,
  };
}

export const seedData: SeedData = createSeedData();
