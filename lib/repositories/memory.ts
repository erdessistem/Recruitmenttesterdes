import "server-only";

import { isRetentionEligible } from "@/lib/admin/retention";

import {
  STAGES,
  type ApplicationStatus,
  type Stage,
} from "@/lib/constants";
import { isVacancyPubliclyOpen } from "@/lib/domain/vacancy";
import { getJakartaMonthRangeUtc } from "@/lib/format/date";
import { normalizeApplicantIdForLookup } from "@/lib/format/applicant-id";
import { normalizeWhatsApp } from "@/lib/format/phone";
import { normalizePersonName } from "@/lib/format/text";
import { conflict, notFound, RepositoryError } from "@/lib/repositories/errors";
import {
  createEmptySeedData,
  seedData as defaultSeedData,
  type SeedData,
} from "@/lib/repositories/seed";
import type {
  AdminUser,
  AnonymizationResult,
  Application,
  ApplicationFilters,
  CreateAdminInput,
  CreateVacancyInput,
  DashboardStats,
  InternalNote,
  NewStageHistoryEvent,
  Repository,
  Settings,
  StageHistoryEntry,
  UpdateVacancyInput,
  Vacancy,
  VacancyFilters,
} from "@/lib/repositories/types";
import { generateAnonymizedIdWithRetry } from "@/lib/security/ids";

export interface MemoryRepositoryOptions {
  /** Pass `false` for an empty repository. Omit to use development seed data. */
  seed?: SeedData | false;
  now?: () => Date;
}

function clone<T>(value: T): T {
  return structuredClone(value);
}

function pad(value: number, length: number): string {
  return String(value).padStart(length, "0");
}

function compareDateDesc(a: string, b: string): number {
  return new Date(b).getTime() - new Date(a).getTime();
}

/**
 * In-memory implementation used by all implementation batches and tests.
 *
 * It deliberately mirrors the behaviour of the Sheets adapter, including
 * counters, idempotent application submission, stage history, and retention.
 */
export class MemoryRepository implements Repository {
  private vacancies: Vacancy[];
  private applications: Application[];
  private stageHistory: StageHistoryEntry[];
  private notes: InternalNote[];
  private adminUsers: AdminUser[];
  private settings: Settings;
  private readonly clock: () => Date;

  /** Snapshot for adapters and tests. Do not expose repository records to clients. */
  exportSnapshot(): SeedData {
    return clone({ vacancies: this.vacancies, applications: this.applications, stageHistory: this.stageHistory, notes: this.notes, adminUsers: this.adminUsers, settings: this.settings });
  }

  constructor(options: MemoryRepositoryOptions = {}) {
    const seed =
      options.seed === false
        ? createEmptySeedData()
        : options.seed ?? defaultSeedData;

    const data = clone(seed);
    this.vacancies = data.vacancies;
    this.applications = data.applications;
    this.stageHistory = data.stageHistory;
    this.notes = data.notes;
    this.adminUsers = data.adminUsers;
    this.settings = data.settings;
    this.clock = options.now ?? (() => new Date());
  }

  private nowIso(): string {
    return this.clock().toISOString();
  }

  private nextVacancyId(): string {
    let counter = this.settings.vacancyCounter;
    let id: string;

    do {
      counter += 1;
      id = `VAC-${pad(counter, 4)}`;
    } while (this.vacancies.some((vacancy) => vacancy.id === id));

    this.settings.vacancyCounter = counter;
    return id;
  }

  private nextHistoryId(): string {
    let counter = this.settings.historyCounter;
    let id: string;

    do {
      counter += 1;
      id = `HIST-${pad(counter, 6)}`;
    } while (this.stageHistory.some((entry) => entry.id === id));

    this.settings.historyCounter = counter;
    return id;
  }

  private nextNoteId(): string {
    let counter = this.settings.noteCounter;
    let id: string;

    do {
      counter += 1;
      id = `NOTE-${pad(counter, 6)}`;
    } while (this.notes.some((note) => note.id === id));

    this.settings.noteCounter = counter;
    return id;
  }

  private findVacancyIndex(id: string): number {
    return this.vacancies.findIndex((vacancy) => vacancy.id === id);
  }

  private requireVacancy(id: string): Vacancy {
    const index = this.findVacancyIndex(id);
    if (index < 0) {
      throw notFound("Lowongan tidak ditemukan.");
    }

    return this.vacancies[index]!;
  }

  private findApplicationIndex(id: string): number {
    const trimmed = id.trim();
    if (!trimmed) return -1;

    const exactIndex = this.applications.findIndex(
      (application) => application.id === trimmed,
    );
    if (exactIndex >= 0) return exactIndex;

    const normalized = normalizeApplicantIdForLookup(trimmed);
    return this.applications.findIndex(
      (application) =>
        normalizeApplicantIdForLookup(application.id) === normalized,
    );
  }

  private requireApplication(id: string): Application {
    const index = this.findApplicationIndex(id);
    if (index < 0) {
      throw notFound("Lamaran tidak ditemukan.");
    }

    return this.applications[index]!;
  }

  private assertUniqueSlug(slug: string, exceptId?: string): void {
    if (
      this.vacancies.some(
        (vacancy) => vacancy.slug === slug && vacancy.id !== exceptId,
      )
    ) {
      throw conflict("Slug lowongan sudah digunakan.");
    }
  }

  async getVacancyPageData(slug: string, now: Date = this.clock()) {
    const vacancy = await this.getVacancyBySlug(slug);
    const open = await this.getOpenVacancies(now);
    return {
      vacancy,
      others: open.filter((item) => item.id !== vacancy?.id),
      companyProfile: clone(this.settings.companyProfile),
    };
  }

  async getHomePageData(now: Date = this.clock()) {
    return {
      vacancies: await this.getOpenVacancies(now),
      companyProfile: clone(this.settings.companyProfile),
    };
  }

  async getOpenVacancies(now: Date = this.clock()): Promise<Vacancy[]> {
    return this.vacancies
      .filter((vacancy) => isVacancyPubliclyOpen(vacancy, now))
      .sort((a, b) => compareDateDesc(a.createdAt, b.createdAt))
      .map((vacancy) => clone(vacancy));
  }

  async getVacancies(filters: VacancyFilters = {}): Promise<Vacancy[]> {
    const query = filters.query?.trim().toLowerCase();
    const department = filters.department?.trim().toLowerCase();

    return this.vacancies
      .filter((vacancy) => {
        if (filters.status && vacancy.status !== filters.status) return false;
        if (department && vacancy.department.toLowerCase() !== department) {
          return false;
        }
        if (query) {
          const haystack = [
            vacancy.title,
            vacancy.slug,
            vacancy.department,
            vacancy.location,
          ]
            .join(" ")
            .toLowerCase();
          if (!haystack.includes(query)) return false;
        }
        return true;
      })
      .sort((a, b) => compareDateDesc(a.createdAt, b.createdAt))
      .map((vacancy) => clone(vacancy));
  }

  async getVacancyBySlug(slug: string): Promise<Vacancy | null> {
    const trimmed = slug.trim();
    const vacancy = this.vacancies.find((item) => item.slug === trimmed);
    return vacancy ? clone(vacancy) : null;
  }

  async getVacancyById(id: string): Promise<Vacancy | null> {
    const vacancy = this.vacancies.find((item) => item.id === id);
    return vacancy ? clone(vacancy) : null;
  }

  async createVacancy(input: CreateVacancyInput): Promise<Vacancy> {
    this.assertUniqueSlug(input.slug);

    const now = this.nowIso();
    const vacancy: Vacancy = {
      id: this.nextVacancyId(),
      ...clone(input),
      createdAt: now,
      updatedAt: now,
    };

    this.vacancies.push(vacancy);
    return clone(vacancy);
  }

  async updateVacancy(
    id: string,
    input: UpdateVacancyInput,
  ): Promise<Vacancy> {
    const vacancy = this.requireVacancy(id);

    if (input.slug) {
      this.assertUniqueSlug(input.slug, id);
    }

    Object.assign(vacancy, clone(input), { updatedAt: this.nowIso() });
    return clone(vacancy);
  }

  async appendApplication(application: Application): Promise<Application> {
    if (
      !application.id.trim() ||
      !application.token.trim() ||
      !application.submissionKey.trim()
    ) {
      throw new RepositoryError(
        "VALIDATION",
        "ID, token, dan submission key lamaran wajib diisi.",
      );
    }

    const existingBySubmission = this.applications.find(
      (item) => item.submissionKey === application.submissionKey,
    );
    if (existingBySubmission) {
      return clone(existingBySubmission);
    }

    this.requireVacancy(application.vacancyId);

    if (this.applications.some((item) => item.status === "active" && item.vacancyId === application.vacancyId && item.whatsapp === application.whatsapp)) {
      throw conflict("Anda sudah memiliki lamaran aktif untuk lowongan ini.");
    }

    if (this.applications.some((item) => item.id === application.id)) {
      throw conflict("Applicant ID sudah digunakan.");
    }

    if (
      this.applications.some((item) => item.token === application.token)
    ) {
      throw conflict("Token lacak sudah digunakan.");
    }

    const stored = clone(application);
    this.applications.push(stored);
    return clone(stored);
  }

  async findApplicationBySubmissionKey(
    key: string,
  ): Promise<Application | null> {
    const application = this.applications.find(
      (item) => item.submissionKey === key.trim(),
    );
    return application ? clone(application) : null;
  }

  async getApplicationById(id: string): Promise<Application | null> {
    const index = this.findApplicationIndex(id);
    return index >= 0 ? clone(this.applications[index]!) : null;
  }

  async getTrackingPageData(token: string) {
    const application = await this.getApplicationByToken(token);
    if (!application) return null;
    const [vacancy, history] = await Promise.all([
      this.getVacancyById(application.vacancyId),
      this.getStageHistory(application.id),
    ]);
    return { application, vacancy, history, companyProfile: clone(this.settings.companyProfile) };
  }

  async getApplicationByToken(token: string): Promise<Application | null> {
    const trimmed = token.trim();
    if (!trimmed) return null;

    const application = this.applications.find(
      (item) => item.token === trimmed,
    );
    return application ? clone(application) : null;
  }

  async findActiveApplicationByPhoneAndVacancy(
    phone: string,
    vacancyId: string,
  ): Promise<Application | null> {
    const normalizedPhone = normalizeWhatsApp(phone);
    if (!normalizedPhone) return null;

    const application = this.applications
      .filter(
        (item) =>
          item.status === "active" &&
          item.vacancyId === vacancyId &&
          item.whatsapp === normalizedPhone,
      )
      .sort((a, b) => compareDateDesc(a.appliedAt, b.appliedAt))[0];

    return application ? clone(application) : null;
  }

  async getApplicationsForRecovery(
    phone: string,
    fullName: string,
  ): Promise<Application[]> {
    const normalizedPhone = normalizeWhatsApp(phone);
    const normalizedName = normalizePersonName(fullName);
    if (!normalizedPhone || !normalizedName) return [];

    return this.applications
      .filter(
        (item) =>
          item.whatsapp === normalizedPhone &&
          normalizePersonName(item.fullName) === normalizedName,
      )
      .sort((a, b) => compareDateDesc(a.appliedAt, b.appliedAt))
      .map((application) => clone(application));
  }

  async getApplications(
    filters: ApplicationFilters = {},
  ): Promise<Application[]> {
    const query = filters.query?.trim().toLowerCase();
    const appliedFrom = filters.appliedFrom
      ? new Date(filters.appliedFrom).getTime()
      : null;
    const appliedTo = filters.appliedTo
      ? new Date(filters.appliedTo).getTime()
      : null;

    return this.applications
      .filter((application) => {
        if (filters.vacancyId && application.vacancyId !== filters.vacancyId) {
          return false;
        }
        if (filters.stage && application.currentStage !== filters.stage) {
          return false;
        }
        if (filters.status && application.status !== filters.status) {
          return false;
        }

        const appliedAt = new Date(application.appliedAt).getTime();
        if (appliedFrom !== null && appliedAt < appliedFrom) return false;
        if (appliedTo !== null && appliedAt > appliedTo) return false;

        if (query) {
          const haystack = [
            application.fullName,
            application.whatsapp,
            application.id,
          ]
            .join(" ")
            .toLowerCase();
          if (!haystack.includes(query)) return false;
        }

        return true;
      })
      .sort((a, b) => compareDateDesc(a.appliedAt, b.appliedAt))
      .map((application) => clone(application));
  }

  async updateApplicationStage(
    id: string,
    stage: Stage,
    status: ApplicationStatus,
    note: string,
    actor: string,
    noteIsPublic = false,
  ): Promise<Application> {
    const application = this.requireApplication(id);

    if (application.status === "withdrawn") {
      throw conflict(
        "Lamaran yang sudah mengundurkan diri tidak dapat diubah.",
      );
    }

    if (application.status === "rejected") {
      if (status !== "active" || stage !== application.currentStage) {
        throw conflict(
          "Lamaran yang ditolak harus dibuka kembali sebelum dipindahkan.",
        );
      }
    }

    if (status === "withdrawn" && actor !== "candidate") {
      throw conflict("Pengunduran diri hanya dapat dilakukan oleh kandidat.");
    }

    if (
      status === "withdrawn" &&
      application.currentStage === "hired"
    ) {
      throw conflict(
        "Kandidat yang sudah diterima tidak dapat mengundurkan diri melalui portal.",
      );
    }

    if (
      status === "rejected" &&
      application.currentStage === "hired"
    ) {
      throw conflict(
        "Kandidat yang sudah diterima tidak dapat langsung ditolak. Pindahkan ke tahap lain terlebih dahulu.",
      );
    }

    if (
      status === application.status &&
      stage === application.currentStage
    ) {
      throw conflict("Tahap dan status lamaran tidak berubah.");
    }

    const effectiveStage =
      status === "rejected" || status === "withdrawn"
        ? application.currentStage
        : stage;

    const now = this.nowIso();
    const history = await this.appendStageHistory({
      applicationId: application.id,
      fromStage: application.currentStage,
      toStage: effectiveStage,
      fromStatus: application.status,
      toStatus: status,
      note: note.trim(),
      noteIsPublic,
      changedBy: actor,
      changedAt: now,
    });

    application.currentStage = effectiveStage;
    application.status = status;
    application.updatedAt = now;

    if (status === "rejected" || status === "withdrawn") {
      application.closedAt ??= history.changedAt;
    } else if (status === "active" && application.closedAt) {
      application.closedAt = null;
    }

    return clone(application);
  }

  async appendStageHistory(
    event: NewStageHistoryEvent,
  ): Promise<StageHistoryEntry> {
    this.requireApplication(event.applicationId);

    const entry: StageHistoryEntry = {
      id: this.nextHistoryId(),
      applicationId: event.applicationId,
      fromStage: event.fromStage,
      toStage: event.toStage,
      fromStatus: event.fromStatus,
      toStatus: event.toStatus,
      note: event.note,
      ...(event.noteIsPublic ? { noteIsPublic: true } : {}),
      changedBy: event.changedBy,
      changedAt: event.changedAt ?? this.nowIso(),
    };

    this.stageHistory.push(entry);
    return clone(entry);
  }

  async getStageHistory(applicationId: string): Promise<StageHistoryEntry[]> {
    return this.stageHistory
      .filter((entry) => entry.applicationId === applicationId)
      .sort((a, b) => {
        const dateComparison =
          new Date(a.changedAt).getTime() - new Date(b.changedAt).getTime();
        return dateComparison !== 0 ? dateComparison : a.id.localeCompare(b.id);
      })
      .map((entry) => clone(entry));
  }

  /** Reconciles every application in one pass; returns how many rows changed. */
  async reconcileAllApplicationStages(): Promise<number> {
    let changed = 0;
    for (const application of this.applications) {
      const before = `${application.currentStage}|${application.status}`;
      await this.reconcileApplicationStage(application.id);
      if (`${application.currentStage}|${application.status}` !== before) changed++;
    }
    return changed;
  }

  async reconcileApplicationStage(id: string): Promise<Application | null> {
    const index = this.findApplicationIndex(id);
    if (index < 0) return null;

    const application = this.applications[index]!;
    const latest = [...this.stageHistory]
      .filter((entry) => entry.applicationId === application.id)
      .sort((a, b) => {
        const dateComparison =
          new Date(a.changedAt).getTime() - new Date(b.changedAt).getTime();
        return dateComparison !== 0
          ? dateComparison
          : a.id.localeCompare(b.id);
      })
      .at(-1);

    if (!latest) return clone(application);

    const changed =
      latest.toStage !== application.currentStage ||
      latest.toStatus !== application.status;

    if (changed) {
      application.currentStage = latest.toStage;
      application.status = latest.toStatus;
      application.updatedAt = this.nowIso();

      if (
        latest.toStatus === "rejected" ||
        latest.toStatus === "withdrawn"
      ) {
        application.closedAt ??= latest.changedAt;
      } else {
        application.closedAt = null;
      }
    }

    return clone(application);
  }

  async addNote(
    applicationId: string,
    authorEmail: string,
    body: string,
  ): Promise<InternalNote> {
    this.requireApplication(applicationId);

    const trimmedBody = body.trim();
    if (!trimmedBody || trimmedBody.length > 2_000) {
      throw new RepositoryError(
        "VALIDATION",
        "Catatan internal harus berisi 1–2.000 karakter.",
      );
    }

    const note: InternalNote = {
      id: this.nextNoteId(),
      applicationId,
      authorEmail: authorEmail.trim(),
      body: trimmedBody,
      createdAt: this.nowIso(),
    };

    this.notes.push(note);
    return clone(note);
  }

  async getNotes(applicationId: string): Promise<InternalNote[]> {
    return this.notes
      .filter((note) => note.applicationId === applicationId)
      .sort((a, b) => compareDateDesc(a.createdAt, b.createdAt))
      .map((note) => clone(note));
  }

  async getDashboardStats(now: Date = this.clock()): Promise<DashboardStats> {
    const nowIso = now.toISOString();
    const monthRange = getJakartaMonthRangeUtc(now);
    const sevenDaysAgo = new Date(
      now.getTime() - 7 * 24 * 60 * 60 * 1_000,
    ).toISOString();

    const stageCounts = Object.fromEntries(
      STAGES.map((stage) => [stage, 0]),
    ) as Record<Stage, number>;

    for (const application of this.applications) {
      if (application.status === "active") {
        stageCounts[application.currentStage] += 1;
      }
    }

    const applicantsPerVacancy = this.vacancies
      .map((vacancy) => ({
        vacancyId: vacancy.id,
        title: vacancy.title,
        count: this.applications.filter(
          (application) => application.vacancyId === vacancy.id,
        ).length,
      }))
      .sort(
        (a, b) =>
          b.count - a.count || a.title.localeCompare(b.title, "id-ID"),
      );

    const recentApplications = [...this.applications]
      .sort((a, b) => compareDateDesc(a.appliedAt, b.appliedAt))
      .slice(0, 5)
      .map((application) => clone(application));

    return {
      activeVacancies: this.vacancies.filter((vacancy) =>
        isVacancyPubliclyOpen(vacancy, now),
      ).length,
      totalApplicants: this.applications.length,
      applicantsThisMonth: this.applications.filter((application) => {
        const appliedAt = new Date(application.appliedAt).getTime();
        return (
          appliedAt >= new Date(monthRange.start).getTime() &&
          appliedAt <= new Date(monthRange.end).getTime()
        );
      }).length,
      newApplicantsLast7Days: this.applications.filter((application) => {
        const appliedAt = new Date(application.appliedAt).getTime();
        return (
          appliedAt >= new Date(sevenDaysAgo).getTime() &&
          appliedAt <= new Date(nowIso).getTime()
        );
      }).length,
      stageCounts,
      rejectedCount: this.applications.filter(
        (application) => application.status === "rejected",
      ).length,
      withdrawnCount: this.applications.filter(
        (application) => application.status === "withdrawn",
      ).length,
      applicantsPerVacancy,
      recentApplications,
    };
  }

  async getSettings(): Promise<Settings> {
    return clone(this.settings);
  }

  async updateSettings(patch: Partial<Settings>): Promise<Settings> {
    this.settings = {
      ...this.settings,
      ...clone(patch),
      companyProfile:
        patch.companyProfile ?? this.settings.companyProfile,
      waTemplates: patch.waTemplates ?? this.settings.waTemplates,
    };

    return clone(this.settings);
  }

  async getAdminByEmail(email: string): Promise<AdminUser | null> {
    const normalized = email.trim().toLowerCase();
    const admin = this.adminUsers.find(
      (user) => user.email.toLowerCase() === normalized,
    );
    return admin ? clone(admin) : null;
  }

  async createAdmin(input: CreateAdminInput): Promise<AdminUser> {
    const email = input.email.trim().toLowerCase();
    if (this.adminUsers.length > 0) throw conflict("Akun superadmin sudah tersedia.");
    if (
      this.adminUsers.some(
        (user) => user.email.toLowerCase() === email,
      )
    ) {
      throw conflict("Email admin sudah digunakan.");
    }

    const highestId = this.adminUsers.reduce((highest, user) => {
      const match = /^ADM-(\d+)$/.exec(user.id);
      if (!match) return highest;
      return Math.max(highest, Number(match[1]));
    }, 0);

    const admin: AdminUser = {
      id: `ADM-${pad(highestId + 1, 4)}`,
      email,
      name: input.name.trim(),
      passwordHash: input.passwordHash,
      role: input.role ?? "superadmin",
      active: true,
      sessionVersion: 1,
      createdAt: this.nowIso(),
      lastLoginAt: null,
    };

    this.adminUsers.push(admin);
    return clone(admin);
  }

  async updateAdminPassword(
    email: string,
    passwordHash: string,
  ): Promise<AdminUser> {
    const normalized = email.trim().toLowerCase();
    const admin = this.adminUsers.find(
      (user) => user.email.toLowerCase() === normalized,
    );
    if (!admin) throw notFound("Akun admin tidak ditemukan.");

    admin.passwordHash = passwordHash;
    admin.sessionVersion += 1;
    return clone(admin);
  }

  async recordAdminLogin(
    email: string,
    at: string = this.nowIso(),
  ): Promise<AdminUser> {
    const normalized = email.trim().toLowerCase();
    const admin = this.adminUsers.find(
      (user) => user.email.toLowerCase() === normalized,
    );
    if (!admin) throw notFound("Akun admin tidak ditemukan.");

    admin.lastLoginAt = at;
    return clone(admin);
  }

  async anonymizeExpiredApplications(
    months: number,
    now: Date = this.clock(),
  ): Promise<AnonymizationResult> {
    if (!Number.isInteger(months) || months < 0) {
      throw new RepositoryError("VALIDATION", "Batas retensi tidak valid.");
    }

    const nowIso = now.toISOString();
    const eligible = this.applications.filter(application => isRetentionEligible(application, months, now));

    const anonymizedIds: string[] = [];

    for (const application of eligible) {
      const oldId = application.id;
      const newId = await generateAnonymizedIdWithRetry((candidate) =>
        Promise.resolve(
          this.applications.some((item) => item.id === candidate),
        ),
      );

      application.id = newId;
      application.token = "";
      application.submissionKey = "";
      application.fullName = "";
      application.whatsapp = "";
      application.email = "";
      application.city = "";
      application.major = "";
      application.lastCompany = "";
      application.lastSalary = 0;
      application.expectedSalary = 0;
      application.cvUrl = "";
      application.linkedinUrl = "";
      application.motivation = "";
      application.sourceOther = "";
      application.anonymizedAt = nowIso;
      application.updatedAt = nowIso;

      for (const entry of this.stageHistory) {
        if (entry.applicationId === oldId) {
          entry.applicationId = newId;
          // Free-text history notes may contain identifying information.
          entry.note = "";
          delete entry.noteIsPublic;
        }
      }

      this.notes = this.notes.filter(
        (note) => note.applicationId !== oldId,
      );

      anonymizedIds.push(newId);
    }

    this.settings.lastPurgeAt = nowIso;
    this.settings.lastPurgeCount = eligible.length;

    return {
      count: eligible.length,
      ids: anonymizedIds,
    };
  }
}

export function createMemoryRepository(
  options: MemoryRepositoryOptions = {},
): MemoryRepository {
  return new MemoryRepository(options);
}
