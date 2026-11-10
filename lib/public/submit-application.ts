import "server-only";
import { isVacancyPubliclyOpen } from "@/lib/domain/vacancy";
import type { Repository, Application } from "@/lib/repositories/types";
import { generateApplicantIdWithRetry, generateSecretToken } from "@/lib/security/ids";
import { applicationFormSchema, isFormTooFast } from "@/lib/validation/application";
import { RepositoryError } from "@/lib/repositories/errors";
import { collectAnswers, screeningErrors } from "@/lib/public/screening";

export type SubmitResult =
  | { ok: true; token: string }
  | { ok: false; message: string; errors?: Record<string, string[]>; duplicate?: boolean };

export async function submitApplication(
  repo: Repository,
  slug: string,
  input: Record<string, unknown>,
  key: string,
  now = new Date(),
): Promise<SubmitResult> {
  const parsed = applicationFormSchema.safeParse(input);
  if (!parsed.success)
    return {
      ok: false,
      message: "Periksa kembali data yang Anda isi.",
      errors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    };
  const data = parsed.data;
  if (!/^[0-9a-f-]{36}$/i.test(key))
    return { ok: false, message: "Sesi formulir tidak valid. Muat ulang halaman dan coba lagi." };
  if (isFormTooFast(data.form_started_at, now.getTime()))
    return { ok: false, message: "Formulir dikirim terlalu cepat. Silakan coba lagi." };
  const existing = await repo.findApplicationBySubmissionKey(key);
  if (existing) {
    const vacancy = await repo.getVacancyBySlug(slug);
    if (existing.whatsapp !== data.whatsapp || existing.vacancyId !== vacancy?.id)
      return { ok: false, message: "Sesi formulir tidak valid. Muat ulang halaman dan coba lagi." };
    if ((await repo.getStageHistory(existing.id)).length === 0)
      await repo.appendStageHistory({
        applicationId: existing.id,
        fromStage: null,
        toStage: "applied",
        fromStatus: null,
        toStatus: "active",
        note: "",
        changedBy: "system",
        changedAt: existing.appliedAt,
      });
    return { ok: true, token: existing.token };
  }
  const vacancy = await repo.getVacancyBySlug(slug);
  if (!vacancy || !isVacancyPubliclyOpen(vacancy, now))
    return { ok: false, message: "Lowongan ini sudah tidak menerima lamaran." };
  const answerErrors = screeningErrors(vacancy.screeningQuestions, input);
  if (Object.keys(answerErrors).length)
    return { ok: false, message: "Periksa kembali data yang Anda isi.", errors: answerErrors };
  if (await repo.findActiveApplicationByPhoneAndVacancy(data.whatsapp, vacancy.id))
    return {
      ok: false,
      duplicate: true,
      message: "Anda sudah memiliki lamaran aktif untuk lowongan ini.",
    };
  const id = await generateApplicantIdWithRetry(
    vacancy.positionCode,
    data.full_name,
    async (candidate) => Boolean(await repo.getApplicationById(candidate)),
  );
  let token = generateSecretToken();
  for (let attempts = 0; await repo.getApplicationByToken(token); attempts++) {
    if (attempts >= 10) throw new Error("Could not generate a unique token");
    token = generateSecretToken();
  }
  const timestamp = now.toISOString();
  const settings = await repo.getSettings();
  const application: Application = {
    id,
    token,
    submissionKey: key,
    vacancyId: vacancy.id,
    fullName: data.full_name,
    whatsapp: data.whatsapp,
    email: data.email,
    city: data.city,
    birthPlace: data.birth_place,
    birthDate: data.birth_date,
    gender: data.gender,
    maritalStatus: data.marital_status,
    religion: data.religion,
    childrenCount: data.children_count,
    lastEducation: data.last_education,
    major: data.major,
    experienceYears: data.experience_years,
    lastCompany: data.last_company,
    lastPosition: data.last_position,
    leaveReason: data.leave_reason,
    screeningAnswers: collectAnswers(vacancy.screeningQuestions, input), referenceName: data.reference_name, referencePhone: data.reference_phone, emergencyName: data.emergency_name, emergencyRelation: data.emergency_relation, emergencyPhone: data.emergency_phone,
    parentName: data.parent_name,
    parentAge: data.parent_age,
    parentOccupation: data.parent_occupation,
    parentAddress: data.parent_address,
    lastSalary: data.last_salary,
    expectedSalary: data.expected_salary,
    cvUrl: data.cv_url,
    linkedinUrl: data.linkedin_url,
    motivation: data.motivation,
    hobbies: data.hobbies,
    achievements: data.achievements,
    otherNotes: data.other_notes,
    availability: data.availability,
    source: data.source,
    sourceOther: data.source === "other" ? data.source_other : "",
    consent: true,
    consentAt: timestamp,
    privacyVersion: settings.privacyVersion,
    currentStage: "applied",
    status: "active",
    appliedAt: timestamp,
    closedAt: null,
    anonymizedAt: null,
    updatedAt: timestamp,
  };
  try {
    const saved = await repo.appendApplication(application);
    if (saved.id !== application.id) {
      if (saved.whatsapp !== data.whatsapp || saved.vacancyId !== vacancy.id)
        return {
          ok: false,
          message: "Sesi formulir tidak valid. Muat ulang halaman dan coba lagi.",
        };
      return { ok: true, token: saved.token };
    }
    await repo.appendStageHistory({
      applicationId: saved.id,
      fromStage: null,
      toStage: "applied",
      fromStatus: null,
      toStatus: "active",
      note: "",
      changedBy: "system",
      changedAt: timestamp,
    });
    return { ok: true, token: saved.token };
  } catch (error) {
    if (
      error instanceof RepositoryError &&
      (await repo.findActiveApplicationByPhoneAndVacancy(data.whatsapp, vacancy.id))
    )
      return {
        ok: false,
        duplicate: true,
        message: "Anda sudah memiliki lamaran aktif untuk lowongan ini.",
      };
    throw error;
  }
}
