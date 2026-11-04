"use client";
import Link from "next/link";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { applicationFormSchema } from "@/lib/validation/application";
import {
  APPLICATION_SOURCE_LABELS,
  AVAILABILITY_LABELS,
  EDUCATION_LEVEL_LABELS,
} from "@/lib/constants";
import { formatRupiahInput } from "@/lib/format/currency";
import { buttonClass } from "@/components/ui/button";
import { apply } from "@/app/(public)/lowongan/[slug]/lamar/actions";

const fields = [
  ["full_name", "Nama lengkap", "text", true],
  ["whatsapp", "No. WhatsApp", "tel", true],
  ["email", "Email", "email", false],
  ["city", "Kota domisili", "text", true],
  ["major", "Jurusan", "text", false],
  ["experience_years", "Pengalaman kerja (tahun)", "number", true],
  ["last_company", "Perusahaan terakhir", "text", false],
  ["last_salary", "Gaji terakhir", "text", true],
  ["expected_salary", "Ekspektasi gaji", "text", true],
  ["cv_url", "Link CV/portfolio", "url", false],
  ["linkedin_url", "LinkedIn", "url", false],
] as const;
export function ApplicationForm({ slug }: { slug: string }) {
  const router = useRouter();
  const started = useRef(0);
  const submissionKey = useRef("");
  const errorSummary = useRef<HTMLDivElement>(null);
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState("");
  const [duplicate, setDuplicate] = useState(false);
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [source, setSource] = useState("");
  useEffect(() => {
    started.current = Date.now();
    submissionKey.current = crypto.randomUUID();
  }, []);
  useEffect(() => {
    if (message) errorSummary.current?.focus();
  }, [message, errors]);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;
    const form = new FormData(event.currentTarget);
    const data: Record<string, unknown> = Object.fromEntries(form.entries());
    data.consent = form.has("consent");
    data.form_started_at = started.current;
    const parsed = applicationFormSchema.safeParse(data);
    if (!parsed.success) {
      setErrors(parsed.error.flatten().fieldErrors as Record<string, string[]>);
      setMessage("Periksa kembali data yang Anda isi.");
      return;
    }
    setErrors({});
    setMessage("");
    setDuplicate(false);
    setPending(true);
    try {
      const result = await apply(slug, data, submissionKey.current);
      if (result.ok) router.push(`/lamaran/berhasil/${result.token}`);
      else {
        setErrors(result.errors ?? {});
        setMessage(result.message);
        setDuplicate(Boolean(result.duplicate));
        setPending(false);
      }
    } catch {
      setMessage("Koneksi terputus. Silakan coba lagi; data Anda tetap tersimpan di formulir ini.");
      setPending(false);
    }
  }
  function field(name: (typeof fields)[number][0]) {
    const [, label, type, required] = fields.find((f) => f[0] === name)!;
    const salary = name === "last_salary" || name === "expected_salary";
    return (
      <label className="block" key={name}>
        <span className="mb-2 block text-sm font-semibold">
          {label}
          {required && " *"}
        </span>
        <input
          className="control"
          id={name}
          name={name}
          type={type}
          aria-required={required}
          inputMode={salary ? "numeric" : undefined}
          min={type === "number" ? 0 : undefined}
          aria-invalid={!!errors[name]}
          aria-describedby={errors[name] ? `${name}-error` : undefined}
          onChange={
            salary
              ? (e) => {
                  e.currentTarget.value = formatRupiahInput(e.currentTarget.value);
                }
              : undefined
          }
        />
        {name === "last_salary" && (
          <span className="mt-1 block text-xs text-muted">Isi 0 jika belum pernah bekerja.</span>
        )}
        {errors[name] && (
          <span id={`${name}-error`} className="mt-1 block text-sm text-danger">
            {errors[name][0]}
          </span>
        )}
      </label>
    );
  }
  function select(name: string, label: string, options: Record<string, string>) {
    return (
      <label className="block">
        <span className="mb-2 block text-sm font-semibold">{label} *</span>
        <select
          className="control"
          id={name}
          name={name}
          defaultValue=""
          aria-required="true"
          aria-describedby={errors[name] ? `${name}-error` : undefined}
          aria-invalid={!!errors[name]}
          onChange={name === "source" ? (e) => setSource(e.target.value) : undefined}
        >
          <option value="">Pilih {label.toLowerCase()}</option>
          {Object.entries(options).map(([value, text]) => (
            <option key={value} value={value}>
              {text}
            </option>
          ))}
        </select>
        {errors[name] && (
          <span id={`${name}-error`} className="mt-1 block text-sm text-danger">
            {errors[name][0]}
          </span>
        )}
      </label>
    );
  }
  return (
    <form onSubmit={submit} noValidate className="mt-8 space-y-6">
      <div aria-live="polite">
        {message && (
          <div
            ref={errorSummary}
            tabIndex={-1}
            role="alert"
            className="rounded-panel border border-danger/30 bg-danger-soft p-4 text-sm text-danger"
          >
            {message}
            {Object.keys(errors).length > 0 && (
              <ul className="mt-2 list-inside list-disc">
                {Object.entries(errors).map(([name, messages]) => (
                  <li key={name}>
                    <a className="underline" href={`#${name}`}>
                      {messages[0]}
                    </a>
                  </li>
                ))}
              </ul>
            )}{" "}
            {duplicate && (
              <Link className="font-semibold underline" href="/lacak">
                Lacak lamaran
              </Link>
            )}
          </div>
        )}
      </div>
      <fieldset disabled={pending} className="space-y-6">
        <section className="form-section">
          <h2 className="form-title">Data diri</h2>
          <div className="grid gap-5 sm:grid-cols-2">
            {fields.slice(0, 4).map((f) => field(f[0]))}
          </div>
        </section>
        <section className="form-section">
          <h2 className="form-title">Pendidikan dan pengalaman</h2>
          <div className="grid gap-5 sm:grid-cols-2">
            {select("last_education", "Pendidikan terakhir", EDUCATION_LEVEL_LABELS)}
            {fields.slice(4, 9).map((f) => field(f[0]))}
          </div>
        </section>
        <section className="form-section">
          <h2 className="form-title">Lamaran</h2>
          <div className="grid gap-5 sm:grid-cols-2">
            {fields.slice(9).map((f) => field(f[0]))}
            <label className="block sm:col-span-2">
              <span className="mb-2 block text-sm font-semibold">Motivasi melamar *</span>
              <textarea
                className="control min-h-32"
                id="motivation"
                name="motivation"
                aria-required="true"
                aria-describedby={errors.motivation ? "motivation-error" : undefined}
                aria-invalid={!!errors.motivation}
              />
              {errors.motivation && (
                <span id="motivation-error" className="text-sm text-danger">
                  {errors.motivation[0]}
                </span>
              )}
            </label>
            {select("availability", "Ketersediaan mulai kerja", AVAILABILITY_LABELS)}
            {select("source", "Sumber informasi", APPLICATION_SOURCE_LABELS)}
            {source === "other" && (
              <label className="block">
                <span className="mb-2 block text-sm font-semibold">Sumber informasi lainnya *</span>
                <input
                  className="control"
                  id="source_other"
                  name="source_other"
                  aria-required="true"
                  aria-invalid={!!errors.source_other}
                  aria-describedby={errors.source_other ? "source_other-error" : undefined}
                />
                {errors.source_other && (
                  <span id="source_other-error" className="text-sm text-danger">
                    {errors.source_other[0]}
                  </span>
                )}
              </label>
            )}
          </div>
        </section>
        <section className="form-section">
          <h2 className="form-title">Persetujuan</h2>
          <label className="flex items-start gap-3 text-sm">
            <input
              className="mt-1 h-4 w-4 accent-primary"
              type="checkbox"
              id="consent"
              name="consent"
              aria-required="true"
              aria-invalid={!!errors.consent}
              aria-describedby={errors.consent ? "consent-error" : undefined}
            />{" "}
            <span>
              Saya menyetujui penggunaan data untuk proses rekrutmen sesuai{" "}
              <Link
                href="/privasi"
                target="_blank"
                className="font-semibold text-primary underline"
              >
                kebijakan privasi
              </Link>
              . *
            </span>
          </label>
          {errors.consent && (
            <p id="consent-error" className="mt-2 text-sm text-danger">
              {errors.consent[0]}
            </p>
          )}
          <div className="absolute left-[-10000px]" aria-hidden="true">
            <label>
              Website
              <input name="website" tabIndex={-1} autoComplete="off" />
            </label>
          </div>
        </section>
        <button className={buttonClass("primary", "w-full px-6 sm:w-auto")} disabled={pending}>
          {pending ? "Mengirim lamaran…" : "Kirim lamaran"}
        </button>
      </fieldset>
    </form>
  );
}
