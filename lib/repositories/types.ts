import "server-only";

import type { ScreeningAnswer, ScreeningQuestion } from "@/lib/public/screening";
import type {
  AdminRole,
  ApplicationSource,
  ApplicationStatus,
  Availability,
  EducationLevel,
  EmploymentType,
  Gender,
  MaritalStatus,
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
  /** Monthly salary range in rupiah; null when not set. */
  salaryMin: number | null;
  salaryMax: number | null;
  /** Whether candidates see the salary range. */
  salaryVisible: boolean;
  screeningQuestions: ScreeningQuestion[];
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
  /** Personal details; empty when not answered or for older applications. */
  birthPlace: string;
  /** YYYY-MM-DD, or empty. */
  birthDate: string;
  gender: Gender | "";
  maritalStatus: MaritalStatus | "";
  religion: string;
  childrenCount: string;
  lastEducation: EducationLevel;
  major: string;
  experienceYears: number;
  lastCompany: string;
  /** Empty for applications made before the field existed. */
  lastPosition: string;
  leaveReason: string;
  /** Answers to the screening questions; empty for older applications. */
  screeningAnswers: ScreeningAnswer[];
  /** Previous supervisor as a reference; empty for older applications. */
  referenceName: string;
  referencePhone: string;
  /** Emergency contact; empty for older applications. */
  emergencyName: string;
  emergencyRelation: string;
  emergencyPhone: string;
  /** Parents' details; empty when not answered. */
  parentName: string;
  parentAge: string;
  parentOccupation: string;
  parentAddress: string;
  lastSalary: number;
  expectedSalary: number;
  cvUrl: string;
  linkedinUrl: string;
  motivation: string;
  hobbies: string;
  achievements: string;
  otherNotes: string;
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
  role: AdminRole;
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
  salaryMin?: number | null;
  salaryMax?: number | null;
  salaryVisible?: boolean;
  screeningQuestions?: ScreeningQuestion[];
}

export type UpdateVacancyInput = Partial<CreateVacancyInput>;

export interface CreateAdminInput {
  email: string;
  name: string;
  passwordHash: string;
  role?: AdminRole;
}

export interface UpdateAdminInput {
  role?: AdminRole;
  active?: boolean;
  passwordHash?: string;
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

/** An application with the time it entered its current stage or status. */
export interface ApplicantRow {
  application: Application;
  /** When the latest stage or status change happened; the application date if none. */
  stageSince: string;
}

export type BulkAction =
  | { type: "move"; stage: Stage; note: string }
  | { type: "reject"; reason: string };

export interface BulkResult {
  updated: string[];
  skipped: Array<{ id: string; name: string; reason: string }>;
}

export interface AnonymizationResult {
  count: number;
  ids: string[];
}

export interface Repository {
  // Vacancies
  getOpenVacancies(now?: Date): Promise<Vacancy[]>;
  /** Open vacancies plus the public company profile in one read (one Sheets load). */
  /** A vacancy by slug, other open vacancies and the company profile in one read. */
  getVacancyPageData(
    slug: string,
    now?: Date,
  ): Promise<{ vacancy: Vacancy | null; others: Vacancy[]; companyProfile: CompanyProfile }>;
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
  /** Everything a token page needs (application, vacancy, history, company profile) in one read. */
  getTrackingPageData(token: string): Promise<{
    application: Application;
    vacancy: Vacancy | null;
    history: StageHistoryEntry[];
    companyProfile: CompanyProfile;
  } | null>;
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

  // Admin pages (each is one Sheets load; the reconciling ones may write once)
  /** Vacancies plus filtered applications with their stage dates. */
  getApplicantList(filters?: ApplicationFilters): Promise<{ vacancies: Vacancy[]; rows: ApplicantRow[] }>;
  /** Reconciles one application, then returns everything its admin page needs. */
  getApplicantWorkspace(
    id: string,
    filters?: ApplicationFilters,
  ): Promise<{
    application: Application;
    vacancy: Vacancy | null;
    history: StageHistoryEntry[];
    notes: InternalNote[];
    settings: Settings;
    rows: ApplicantRow[];
  } | null>;
  /** Reconciles all applications, then returns dashboard stats, vacancies and every row. */
  getDashboardData(now?: Date): Promise<{ stats: DashboardStats; vacancies: Vacancy[]; rows: ApplicantRow[] }>;
  /** Applies one action to many applications in a single write. Ineligible ones are skipped. */
  bulkUpdateApplications(ids: string[], action: BulkAction, actor: string): Promise<BulkResult>;

  /** Everything the reports page needs, in one read. */
  getReportData(): Promise<{ vacancies: Vacancy[]; applications: Application[]; history: StageHistoryEntry[] }>;

  // Dashboard and settings
  getDashboardStats(now?: Date): Promise<DashboardStats>;
  getSettings(): Promise<Settings>;
  updateSettings(patch: Partial<Settings>): Promise<Settings>;

  // Admin accounts
  getAdminByEmail(email: string): Promise<AdminUser | null>;
  createAdmin(input: CreateAdminInput): Promise<AdminUser>;
  updateAdminPassword(email: string, passwordHash: string): Promise<AdminUser>;
  getAdmins(): Promise<AdminUser[]>;
  /** Adds another admin account (createAdmin only creates the very first one). */
  addAdmin(input: CreateAdminInput): Promise<AdminUser>;
  /** Changes role, active state or password. Signs the account out everywhere. */
  updateAdmin(id: string, input: UpdateAdminInput): Promise<AdminUser>;
  recordAdminLogin(email: string, at?: string): Promise<AdminUser>;

  // Retention
  anonymizeExpiredApplications(
    months: number,
    now?: Date,
  ): Promise<AnonymizationResult>;
}
