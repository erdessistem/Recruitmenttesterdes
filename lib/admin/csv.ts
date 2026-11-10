import "server-only";
import type { Application, Vacancy } from "@/lib/repositories/types";
import {
  APPLICATION_STATUS_LABELS,
  GENDER_LABELS,
  MARITAL_STATUS_LABELS,
  STAGE_LABELS,
} from "@/lib/constants";
import { answerLabel, hasMismatch } from "@/lib/public/screening";

/** Escape formula prefixes, including dangerous characters after leading whitespace. */
export function csvCell(value: unknown): string {
  let text = value == null ? "" : String(value);
  if (/^[\s]*[=+\-@\t\r]/.test(text)) text = `'${text}`;
  return `"${text.replace(/"/g, '""')}"`;
}
export function applicantsCsv(applications: Application[], vacancies: Vacancy[]): string {
  const title = new Map(vacancies.map((v) => [v.id, v.title]));
  const columns: Array<[string, (a: Application) => unknown]> = [
    ["Applicant ID", (a) => a.id],
    ["Lowongan", (a) => title.get(a.vacancyId) ?? ""],
    ["Nama lengkap", (a) => a.fullName],
    ["WhatsApp", (a) => a.whatsapp],
    ["Email", (a) => a.email],
    ["Alamat domisili", (a) => a.city],
    ["Tempat lahir", (a) => a.birthPlace],
    ["Tanggal lahir", (a) => a.birthDate],
    ["Jenis kelamin", (a) => (a.gender ? GENDER_LABELS[a.gender] : "")],
    ["Status pernikahan", (a) => (a.maritalStatus ? MARITAL_STATUS_LABELS[a.maritalStatus] : "")],
    ["Agama", (a) => a.religion],
    ["Jumlah anak", (a) => a.childrenCount],
    ["Pendidikan", (a) => a.lastEducation],
    ["Jurusan", (a) => a.major],
    ["Pengalaman tahun", (a) => a.experienceYears],
    ["Perusahaan terakhir", (a) => a.lastCompany],
    ["Posisi terakhir", (a) => a.lastPosition],
    ["Alasan berhenti bekerja", (a) => a.leaveReason],
    ["Nama referensi", (a) => a.referenceName],
    ["Nomor referensi", (a) => a.referencePhone],
    ["Kontak darurat", (a) => a.emergencyName],
    ["Hubungan kontak darurat", (a) => a.emergencyRelation],
    ["Nomor darurat", (a) => a.emergencyPhone],
    ["Nama orang tua", (a) => a.parentName],
    ["Umur orang tua", (a) => a.parentAge],
    ["Pekerjaan orang tua", (a) => a.parentOccupation],
    ["Alamat orang tua", (a) => a.parentAddress],
    [
      "Jawaban screening",
      (a) => a.screeningAnswers.map((x) => `${x.question}: ${answerLabel(x)}`).join(" | "),
    ],
    ["Jawaban tidak sesuai", (a) => (hasMismatch(a.screeningAnswers) ? "Ya" : "")],
    ["Gaji terakhir", (a) => a.lastSalary],
    ["Ekspektasi gaji", (a) => a.expectedSalary],
    ["CV", (a) => a.cvUrl],
    ["LinkedIn", (a) => a.linkedinUrl],
    ["Motivasi", (a) => a.motivation],
    ["Hobi / keahlian", (a) => a.hobbies],
    ["Prestasi / kejuaraan", (a) => a.achievements],
    ["Keterangan lain", (a) => a.otherNotes],
    ["Ketersediaan", (a) => a.availability],
    ["Sumber", (a) => a.source],
    ["Sumber lainnya", (a) => a.sourceOther],
    ["Persetujuan", (a) => a.consent],
    ["Waktu persetujuan", (a) => a.consentAt],
    ["Versi privasi", (a) => a.privacyVersion],
    ["Tahap", (a) => STAGE_LABELS[a.currentStage]],
    ["Status", (a) => APPLICATION_STATUS_LABELS[a.status]],
    ["Tanggal lamaran", (a) => a.appliedAt],
    ["Tanggal ditutup", (a) => a.closedAt],
    ["Tanggal anonim", (a) => a.anonymizedAt],
    ["Diperbarui", (a) => a.updatedAt],
  ];
  return (
    "\uFEFF" +
    [
      columns.map(([name]) => csvCell(name)).join(","),
      ...applications.map((a) => columns.map(([, read]) => csvCell(read(a))).join(",")),
    ].join("\r\n") +
    "\r\n"
  );
}
