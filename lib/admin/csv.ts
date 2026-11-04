import "server-only";
import type { Application, Vacancy } from "@/lib/repositories/types";
import { APPLICATION_STATUS_LABELS, STAGE_LABELS } from "@/lib/constants";

/** Escape formula prefixes, including dangerous characters after leading whitespace. */
export function csvCell(value: unknown): string {
  let text = value == null ? "" : String(value);
  if (/^[\s]*[=+\-@\t\r]/.test(text)) text = `'${text}`;
  return `"${text.replace(/"/g, '""')}"`;
}
export function applicantsCsv(applications: Application[], vacancies: Vacancy[]): string {
  const title = new Map(vacancies.map(v => [v.id, v.title]));
  const columns: Array<[string, (a: Application) => unknown]> = [
    ["Applicant ID", a => a.id], ["Lowongan", a => title.get(a.vacancyId) ?? ""], ["Nama lengkap", a => a.fullName], ["WhatsApp", a => a.whatsapp], ["Email", a => a.email], ["Kota", a => a.city], ["Pendidikan", a => a.lastEducation], ["Jurusan", a => a.major], ["Pengalaman tahun", a => a.experienceYears], ["Perusahaan terakhir", a => a.lastCompany], ["Gaji terakhir", a => a.lastSalary], ["Ekspektasi gaji", a => a.expectedSalary], ["CV", a => a.cvUrl], ["LinkedIn", a => a.linkedinUrl], ["Motivasi", a => a.motivation], ["Ketersediaan", a => a.availability], ["Sumber", a => a.source], ["Sumber lainnya", a => a.sourceOther], ["Persetujuan", a => a.consent], ["Waktu persetujuan", a => a.consentAt], ["Versi privasi", a => a.privacyVersion], ["Tahap", a => STAGE_LABELS[a.currentStage]], ["Status", a => APPLICATION_STATUS_LABELS[a.status]], ["Tanggal lamaran", a => a.appliedAt], ["Tanggal ditutup", a => a.closedAt], ["Tanggal anonim", a => a.anonymizedAt], ["Diperbarui", a => a.updatedAt],
  ];
  return "\uFEFF" + [columns.map(([name]) => csvCell(name)).join(","), ...applications.map(a => columns.map(([, read]) => csvCell(read(a))).join(","))].join("\r\n") + "\r\n";
}
