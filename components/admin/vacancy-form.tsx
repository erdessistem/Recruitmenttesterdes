"use client";
import { useState, type FormEvent } from "react";
import type { Vacancy } from "@/lib/repositories/types";
import { saveVacancy, type FormResult } from "@/app/admin/(protected)/lowongan/actions";
import { EMPLOYMENT_TYPE_LABELS, VACANCY_STATUS_LABELS } from "@/lib/constants";
import { slugify } from "@/lib/format/text";
import { sanitizePositionCode } from "@/lib/format/applicant-id";
import { formatJakartaDateKey } from "@/lib/format/date";
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
    <form onSubmit={submit} className="admin-card mt-6 space-y-5">
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
      <button
        disabled={pending}
        className="rounded-control bg-primary px-5 py-3 font-semibold text-white disabled:opacity-50"
      >
        {pending ? "Menyimpan…" : "Simpan lowongan"}
      </button>
    </form>
  );
}
