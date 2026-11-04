import "server-only";

import type {
  ApplicationSource,
  ApplicationStatus,
  Availability,
  EducationLevel,
  EmploymentType,
  Stage,
  VacancyStatus,
} from "@/lib/constants";

export interface CompanyProfile {
  name: string;
  address: string;
  contactEmail: string;
  contactWhatsapp: string;
}

export interface WhatsAppTemplates {
  default: string;
  byStage?: Partial<Record<Stage, string>>;
}

export interface Vacancy {
  id: string;
  slug: string;
  title: string;
  positionCode: string;
  department: string;
  location: string;
  employmentType: EmploymentType;
  description: string;
  requirements: string;
  quota: number;
  openAt: string | null;
  closeAt: string | null;
  status: VacancyStatus;
  createdAt: string;
  updatedAt: string;
}

export interface Application {
  id: string;
  token: string;
  submissionKey: string;
  vacancyId: string;
  fullName: string;
  whatsapp: string;
  email: string;
  city: string;
  lastEducation: EducationLevel;
  major: string;
  experienceYears: number;
  lastCompany: string;
  lastSalary: number;
  expectedSalary: number;
  cvUrl: string;
  linkedinUrl: string;
  motivation: string;
  availability: Availability;
  source: ApplicationSource;
  sourceOther: string;
  consent: boolean;
  consentAt: string;
  privacyVersion: string;
  currentStage: Stage;
  status: ApplicationStatus;
  appliedAt: string;
  closedAt: string | null;
  anonymizedAt: string | null;
  updatedAt: string;
}

export interface StageHistoryEntry {
  id: string;
  applicationId: string;
  fromStage: Stage | null;
  toStage: Stage;
  fromStatus: ApplicationStatus | null;
  toStatus: ApplicationStatus;
  note: string;
  noteIsPublic?: boolean;
  changedBy: string;
  changedAt: string;
}

export interface InternalNote {
  id: string;
  applicationId: string;
  authorEmail: string;
  body: string;
  createdAt: string;
}

export interface AdminUser {
  id: string;
  email: string;
  name: string;
  passwordHash: string;
  role: "superadmin";
  active: boolean;
  sessionVersion: number;
  createdAt: string;
  lastLoginAt: string | null;
}

export interface Settings {
  schemaVersion: string;
  privacyVersion: string;
  vacancyCounter: number;
  historyCounter: number;
  noteCounter: number;
  companyProfile: CompanyProfile;
  waTemplates: WhatsAppTemplates;
  retentionMonths: number;
  lastPurgeAt: string | null;
  lastPurgeCount: number | null;
}

export interface VacancyFilters {
  status?: VacancyStatus;
  department?: string;
  query?: string;
}

export interface ApplicationFilters {
  query?: string;
  vacancyId?: string;
  stage?: Stage;
  status?: ApplicationStatus;
  appliedFrom?: string;
  appliedTo?: string;
}

export interface CreateVacancyInput {
  slug: string;
  title: string;
  positionCode: string;
  department: string;
  location: string;
  employmentType: EmploymentType;
  description: string;
  requirements: string;
  quota: number;
  openAt: string | null;
  closeAt: string | null;
  status: VacancyStatus;
}

export type UpdateVacancyInput = Partial<CreateVacancyInput>;

export interface CreateAdminInput {
  email: string;
  name: string;
  passwordHash: string;
  role?: "superadmin";
}

export interface NewStageHistoryEvent {
  applicationId: string;
  fromStage: Stage | null;
  toStage: Stage;
  fromStatus: ApplicationStatus | null;
  toStatus: ApplicationStatus;
  note: string;
  noteIsPublic?: boolean;
  changedBy: string;
  changedAt?: string;
}

export interface DashboardStats {
  activeVacancies: number;
  totalApplicants: number;
  applicantsThisMonth: number;
  newApplicantsLast7Days: number;
  stageCounts: Record<Stage, number>;
  rejectedCount: number;
  withdrawnCount: number;
  applicantsPerVacancy: Array<{
    vacancyId: string;
    title: string;
    count: number;
  }>;
  recentApplications: Application[];
}

export interface AnonymizationResult {
  count: number;
  ids: string[];
}

export interface Repository {
  // Vacancies
  getOpenVacancies(now?: Date): Promise<Vacancy[]>;
  /** Open vacancies plus the public company profile in one read (one Sheets load). */
  getHomePageData(now?: Date): Promise<{ vacancies: Vacancy[]; companyProfile: CompanyProfile }>;
  getVacancies(filters?: VacancyFilters): Promise<Vacancy[]>;
  getVacancyBySlug(slug: string): Promise<Vacancy | null>;
  getVacancyById(id: string): Promise<Vacancy | null>;
  createVacancy(input: CreateVacancyInput): Promise<Vacancy>;
  updateVacancy(id: string, input: UpdateVacancyInput): Promise<Vacancy>;

  // Applications
  appendApplication(application: Application): Promise<Application>;
  findApplicationBySubmissionKey(key: string): Promise<Application | null>;
  getApplicationById(id: string): Promise<Application | null>;
  getApplicationByToken(token: string): Promise<Application | null>;
  findActiveApplicationByPhoneAndVacancy(
    phone: string,
    vacancyId: string,
  ): Promise<Application | null>;
  getApplicationsForRecovery(
    phone: string,
    fullName: string,
  ): Promise<Application[]>;
  getApplications(filters?: ApplicationFilters): Promise<Application[]>;
  updateApplicationStage(
    id: string,
    stage: Stage,
    status: ApplicationStatus,
    note: string,
    actor: string,
    noteIsPublic?: boolean,
  ): Promise<Application>;

  // Timeline
  appendStageHistory(event: NewStageHistoryEvent): Promise<StageHistoryEntry>;
  getStageHistory(applicationId: string): Promise<StageHistoryEntry[]>;
  reconcileApplicationStage(id: string): Promise<Application | null>;
  /** One read and at most one write batch for all applications. */
  reconcileAllApplicationStages(): Promise<number>;

  // Internal notes
  addNote(
    applicationId: string,
    authorEmail: string,
    body: string,
  ): Promise<InternalNote>;
  getNotes(applicationId: string): Promise<InternalNote[]>;

  // Dashboard and settings
  getDashboardStats(now?: Date): Promise<DashboardStats>;
  getSettings(): Promise<Settings>;
  updateSettings(patch: Partial<Settings>): Promise<Settings>;

  // Admin accounts
  getAdminByEmail(email: string): Promise<AdminUser | null>;
  createAdmin(input: CreateAdminInput): Promise<AdminUser>;
  updateAdminPassword(email: string, passwordHash: string): Promise<AdminUser>;
  recordAdminLogin(email: string, at?: string): Promise<AdminUser>;

  // Retention
  anonymizeExpiredApplications(
    months: number,
    now?: Date,
  ): Promise<AnonymizationResult>;
}
