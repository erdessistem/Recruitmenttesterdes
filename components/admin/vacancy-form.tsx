"use client";
import { useState, type FormEvent } from "react";
import type { Vacancy } from "@/lib/repositories/types";
import { saveVacancy, type FormResult } from "@/app/admin/(protected)/lowongan/actions";
import { EMPLOYMENT_TYPE_LABELS, VACANCY_STATUS_LABELS } from "@/lib/constants";
import { slugify } from "@/lib/format/text";
import { sanitizePositionCode } from "@/lib/format/applicant-id";
import { formatJakartaDateKey } from "@/lib/format/date";
import { formatRupiahInput } from "@/lib/format/currency";
import { ScreeningEditor } from "./screening-editor";
export function VacancyForm({ vacancy }: { vacancy?: Vacancy }) {
  const [result, setResult] = useState<FormResult>({ message: "" });
  const [pending, setPending] = useState(false);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;
    const form = new FormData(event.currentTarget);
    setPending(true);
    try {
      setResult(await saveVacancy(vacancy?.id ?? null, result, form));
    } catch {
      setResult({ message: "Lowongan belum dapat disimpan. Silakan coba lagi." });
    } finally {
      setPending(false);
    }
  }
  const [slug, setSlug] = useState(vacancy?.slug ?? "");
  const [code, setCode] = useState(vacancy?.positionCode ?? "");
  const [slugEdited, setSlugEdited] = useState(Boolean(vacancy));
  const [codeEdited, setCodeEdited] = useState(Boolean(vacancy));
  const err = (name: string) =>
    result.errors?.[name] && (
      <span className="mt-1 block text-sm text-danger">{result.errors[name][0]}</span>
    );
  const input = (name: string, label: string, value: string | number = "", type = "text") => (
    <label className="block text-sm font-semibold">
      {label}
      <input
        className="control mt-2 font-normal"
        name={name}
        defaultValue={value}
        type={type}
        aria-invalid={!!result.errors?.[name]}
      />
      {err(name)}
    </label>
  );
  return (
    <form method="post" onSubmit={submit} className="admin-card mt-6 space-y-5">
      {result.message && (
        <p role="alert" className="rounded-control bg-danger-soft p-3 text-sm text-danger">
          {result.message}
        </p>
      )}
      <div className="grid gap-5 sm:grid-cols-2">
        <label className="block text-sm font-semibold sm:col-span-2">
          Judul lowongan
          <input
            name="title"
            defaultValue={vacancy?.title}
            className="control mt-2 font-normal"
            onChange={(e) => {
              if (!slugEdited) setSlug(slugify(e.target.value));
              if (!codeEdited) setCode(sanitizePositionCode(e.target.value).slice(0, 24));
            }}
          />
          {err("title")}
        </label>
        <label className="block text-sm font-semibold">
          Slug
          <input
            name="slug"
            value={slug}
            onChange={(e) => {
              setSlugEdited(true);
              setSlug(e.target.value);
            }}
            className="control mt-2 font-normal"
          />
          {err("slug")}
        </label>
        <label className="block text-sm font-semibold">
          Kode posisi
          <input
            name="position_code"
            value={code}
            onChange={(e) => {
              setCodeEdited(true);
              setCode(e.target.value);
            }}
            className="control mt-2 font-normal"
          />
          <span className="mt-1 block text-xs font-normal text-muted">
            Perubahan hanya berlaku untuk Applicant ID baru.
          </span>
          {err("position_code")}
        </label>
        {input("department", "Departemen", vacancy?.department)}
        {input("location", "Lokasi", vacancy?.location)}
        <label className="block text-sm font-semibold">
          Jenis pekerjaan
          <select
            name="employment_type"
            defaultValue={vacancy?.employmentType ?? "full_time"}
            className="control mt-2 font-normal"
          >
            {Object.entries(EMPLOYMENT_TYPE_LABELS).map(([v, label]) => (
              <option key={v} value={v}>
                {label}
              </option>
            ))}
          </select>
          {err("employment_type")}
        </label>
        {input("quota", "Kuota", vacancy?.quota ?? 0, "number")}
        {input(
          "open_at",
          "Tanggal buka",
          vacancy?.openAt ? formatJakartaDateKey(vacancy.openAt) : "",
          "date",
        )}
        {input(
          "close_at",
          "Tanggal tutup",
          vacancy?.closeAt ? formatJakartaDateKey(vacancy.closeAt) : "",
          "date",
        )}
        <label className="block text-sm font-semibold">
          Status
          <select
            name="status"
            defaultValue={vacancy?.status ?? "draft"}
            className="control mt-2 font-normal"
          >
            {Object.entries(VACANCY_STATUS_LABELS).map(([v, label]) => (
              <option key={v} value={v}>
                {label}
              </option>
            ))}
          </select>
          {err("status")}
        </label>
      </div>
      {(
        [
          ["description", "Deskripsi", vacancy?.description],
          ["requirements", "Persyaratan", vacancy?.requirements],
        ] as const
      ).map(([name, label, value]) => (
        <label key={name} className="block text-sm font-semibold">
          {label}
          <textarea
            name={name}
            defaultValue={value}
            rows={6}
            className="control mt-2 font-normal"
          />
          {err(name)}
        </label>
      ))}
      <fieldset className="space-y-4 border-t border-border pt-6">
        <legend className="text-h3">Gaji</legend>
        <p className="text-sm text-muted">
          Opsional, per bulan. Isi salah satu atau keduanya. Selalu terlihat oleh admin untuk
          dibandingkan dengan ekspektasi gaji pelamar.
        </p>
        <div className="grid gap-5 sm:grid-cols-2">
          {(
            [
              ["salary_min", "Gaji minimum", vacancy?.salaryMin],
              ["salary_max", "Gaji maksimum", vacancy?.salaryMax],
            ] as const
          ).map(([name, label, value]) => (
            <label key={name} className="block text-sm font-semibold">
              {label}
              <span className="relative mt-2 block">
                <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm font-normal text-muted">
                  Rp
                </span>
                <input
                  className="control pl-10 font-normal"
                  name={name}
                  inputMode="numeric"
                  defaultValue={value != null ? formatRupiahInput(String(value)) : ""}
                  aria-invalid={!!result.errors?.[name]}
                  onChange={(e) => {
                    e.currentTarget.value = formatRupiahInput(e.currentTarget.value);
                  }}
                />
              </span>
              {err(name)}
            </label>
          ))}
        </div>
        <label className="flex items-start gap-3 text-sm">
          <input
            type="checkbox"
            name="salary_visible"
            defaultChecked={vacancy?.salaryVisible ?? false}
            className="mt-0.5 h-4 w-4 accent-navy"
          />
          <span>
            <span className="font-semibold">Tampilkan ke pelamar</span>
            <span className="block text-muted">
              Rentang gaji muncul di daftar lowongan dan halaman lowongan.
            </span>
          </span>
        </label>
        {err("salary_visible")}
      </fieldset>
      <div className="border-t border-border pt-6">
        <ScreeningEditor
          initial={vacancy?.screeningQuestions ?? []}
          error={result.errors?.screening_questions}
        />
      </div>
      <button
        disabled={pending}
        className="inline-flex min-h-11 items-center justify-center rounded-full bg-primary px-6 py-2 text-sm font-semibold text-white transition-colors hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-45 motion-reduce:transition-none"
      >
        {pending ? "Menyimpan…" : "Simpan lowongan"}
      </button>
    </form>
  );
}
