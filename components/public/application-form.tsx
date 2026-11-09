"use client";
import Link from "next/link";
import { useEffect, useRef, useState, type FormEvent, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { Check, RotateCcw } from "lucide-react";
import {
  APPLICATION_SOURCE_LABELS,
  AVAILABILITY_LABELS,
  EDUCATION_LEVEL_LABELS,
  SOURCE_OTHER,
} from "@/lib/constants";
import { formatRupiahInput } from "@/lib/format/currency";
import { formatWhatsAppDisplay, normalizeWhatsApp } from "@/lib/format/phone";
import {
  APPLICATION_STEPS,
  DRAFT_FIELDS,
  errorsFor,
  firstStepWithError,
  stepErrors,
  type FieldErrors,
} from "@/lib/public/application-steps";
import { buttonClass } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { cn } from "@/lib/utils";
import { apply } from "@/app/(public)/lowongan/[slug]/lamar/actions";

type Values = Record<string, string>;
const LAST_STEP = APPLICATION_STEPS.length - 1;

const LABELS: Record<string, string> = {
  full_name: "Nama lengkap",
  whatsapp: "No. WhatsApp",
  email: "Email",
  city: "Alamat domisili",
  last_education: "Pendidikan terakhir",
  major: "Jurusan",
  experience_years: "Pengalaman kerja",
  last_company: "Perusahaan terakhir",
  last_position: "Posisi terakhir",
  last_salary: "Gaji terakhir",
  expected_salary: "Ekspektasi gaji",
  cv_url: "Link CV/portfolio",
  linkedin_url: "LinkedIn",
  motivation: "Motivasi melamar",
  availability: "Ketersediaan mulai kerja",
  source: "Sumber informasi",
  source_other: "Sumber informasi lainnya",
};

function storage(): Storage | null {
  try {
    return window.sessionStorage;
  } catch {
    return null;
  }
}

/**
 * Four-step application form. Every step stays mounted (hidden), so the final
 * submit still sends all fields. The draft lives in sessionStorage only: it
 * survives a reload or going back, but not closing the tab, which matters on
 * shared or warnet computers.
 */
export function ApplicationForm({ slug }: { slug: string }) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const headingRefs = useRef<(HTMLHeadingElement | null)[]>([]);
  const started = useRef(0);
  const submissionKey = useRef("");
  const dirty = useRef(false);
  const submitted = useRef(false);
  const previousStep = useRef(0);
  const errorSummary = useRef<HTMLDivElement>(null);
  const draftKey = `erdes-lamaran-draft:${slug}`;

  const [step, setStep] = useState(0);
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState("");
  const [duplicate, setDuplicate] = useState(false);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [source, setSource] = useState("");
  const [restored, setRestored] = useState(false);
  const [review, setReview] = useState<Values>({});
  // Submitting before hydration would fall back to a native submit; block it until React is ready.
  const [ready, setReady] = useState(false);

  function collect(): Record<string, unknown> {
    const form = formRef.current;
    if (!form) return {};
    const data = new FormData(form);
    const values: Record<string, unknown> = Object.fromEntries(data.entries());
    values.consent = data.has("consent");
    values.form_started_at = started.current;
    return values;
  }

  // Start timing, create the idempotency key and restore any draft.
  useEffect(() => {
    started.current = Date.now();
    submissionKey.current = crypto.randomUUID();
    setReady(true);
    const raw = storage()?.getItem(draftKey);
    if (!raw || !formRef.current) return;
    try {
      const draft = JSON.parse(raw) as Values;
      let any = false;
      for (const name of DRAFT_FIELDS) {
        const element = formRef.current.elements.namedItem(name);
        if (
          draft[name] &&
          (element instanceof HTMLInputElement ||
            element instanceof HTMLSelectElement ||
            element instanceof HTMLTextAreaElement)
        ) {
          element.value = draft[name];
          any = true;
        }
      }
      if (draft.source) setSource(draft.source);
      if (any) {
        setRestored(true);
        dirty.current = true;
      }
    } catch {
      storage()?.removeItem(draftKey);
    }
  }, [draftKey]);

  // Warn before leaving a half-filled form.
  useEffect(() => {
    function onBeforeUnload(event: BeforeUnloadEvent) {
      if (dirty.current && !submitted.current) event.preventDefault();
    }
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, []);

  // Move focus to the new step's heading so keyboard and screen reader users follow along.
  useEffect(() => {
    if (previousStep.current === step) return;
    previousStep.current = step;
    const heading = headingRefs.current[step];
    heading?.focus({ preventScroll: true });
    formRef.current?.scrollIntoView({ block: "start", behavior: "smooth" });
  }, [step]);

  useEffect(() => {
    if (message) errorSummary.current?.focus();
  }, [message]);

  function saveDraft() {
    dirty.current = true;
    const values = collect();
    const draft: Values = {};
    for (const name of DRAFT_FIELDS) if (values[name]) draft[name] = String(values[name]);
    try {
      storage()?.setItem(draftKey, JSON.stringify(draft));
    } catch {
      // Storage full or blocked: the form still works, only the draft is lost.
    }
  }

  function clearDraft() {
    storage()?.removeItem(draftKey);
    formRef.current?.reset();
    setSource("");
    setErrors({});
    setRestored(false);
    dirty.current = false;
    setStep(0);
  }

  function validateField(name: string) {
    const fieldErrors = errorsFor(collect(), [name]);
    setErrors((previous) => {
      const next = { ...previous };
      delete next[name];
      return { ...next, ...fieldErrors };
    });
  }

  function focusFirstError(found: FieldErrors) {
    const name = Object.keys(found)[0];
    const element = name ? document.getElementById(name) : null;
    element?.focus();
  }

  function goTo(target: number) {
    if (target === LAST_STEP) {
      const values = collect();
      setReview(Object.fromEntries(Object.entries(values).map(([k, v]) => [k, String(v ?? "")])));
    }
    setMessage("");
    setStep(target);
  }

  function next() {
    const found = stepErrors(collect(), step);
    if (Object.keys(found).length) {
      setErrors((previous) => ({ ...previous, ...found }));
      setTimeout(() => focusFirstError(found), 0);
      return;
    }
    goTo(step + 1);
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;
    if (step < LAST_STEP) return next();
    const data = collect();
    const found = errorsFor(
      data,
      APPLICATION_STEPS.flatMap((s) => s.fields),
    );
    if (Object.keys(found).length) {
      setErrors(found);
      const target = firstStepWithError(found);
      if (target !== null && target !== step) goTo(target);
      setMessage("Periksa kembali data yang Anda isi.");
      return;
    }
    setErrors({});
    setMessage("");
    setDuplicate(false);
    setPending(true);
    try {
      const result = await apply(slug, data, submissionKey.current);
      if (result.ok) {
        submitted.current = true;
        storage()?.removeItem(draftKey);
        router.push(`/lamaran/berhasil/${result.token}`);
      } else {
        const serverErrors = result.errors ?? {};
        setErrors(serverErrors);
        const target = firstStepWithError(serverErrors);
        if (target !== null && target !== step) goTo(target);
        setMessage(result.message);
        setDuplicate(Boolean(result.duplicate));
        setPending(false);
      }
    } catch {
      setMessage("Koneksi terputus. Coba kirim lagi; isian Anda masih tersimpan di formulir ini.");
      setPending(false);
    }
  }

  function input(
    name: string,
    options: {
      type?: string;
      required?: boolean;
      hint?: ReactNode;
      autoComplete?: string;
      inputMode?: "numeric" | "tel" | "email" | "url";
      className?: string;
    } = {},
  ) {
    const salary = name === "last_salary" || name === "expected_salary";
    return (
      <Field
        label={LABELS[name]}
        required={options.required}
        hint={options.hint}
        error={errors[name]?.[0]}
        className={options.className}
      >
        <input
          className="control"
          id={name}
          name={name}
          type={options.type ?? "text"}
          autoComplete={options.autoComplete}
          inputMode={salary ? "numeric" : options.inputMode}
          min={options.type === "number" ? 0 : undefined}
          onChange={
            salary
              ? (event) => {
                  event.currentTarget.value = formatRupiahInput(event.currentTarget.value);
                }
              : undefined
          }
        />
      </Field>
    );
  }

  function select(name: string, options: Record<string, string>) {
    return (
      <Field label={LABELS[name]} required error={errors[name]?.[0]}>
        <select
          className="control"
          id={name}
          name={name}
          defaultValue=""
          onChange={name === "source" ? (event) => setSource(event.target.value) : undefined}
        >
          <option value="">Pilih {LABELS[name].toLowerCase()}</option>
          {Object.entries(options).map(([value, text]) => (
            <option key={value} value={value}>
              {text}
            </option>
          ))}
        </select>
      </Field>
    );
  }

  function section(index: number, children: ReactNode) {
    return (
      <section
        hidden={step !== index}
        aria-labelledby={`step-${index}-title`}
        className="form-section"
      >
        <h2
          id={`step-${index}-title`}
          ref={(element) => {
            headingRefs.current[index] = element;
          }}
          tabIndex={-1}
          className="form-title outline-none"
        >
          <span className="sr-only">
            Langkah {index + 1} dari {APPLICATION_STEPS.length}:{" "}
          </span>
          {APPLICATION_STEPS[index].title}
        </h2>
        {children}
      </section>
    );
  }

  const whatsappNormalized = normalizeWhatsApp(review.whatsapp);
  const reviewValue = (name: string): string => {
    const value = review[name] ?? "";
    if (!value) return "—";
    if (name === "last_education")
      return EDUCATION_LEVEL_LABELS[value as keyof typeof EDUCATION_LEVEL_LABELS] ?? value;
    if (name === "availability")
      return AVAILABILITY_LABELS[value as keyof typeof AVAILABILITY_LABELS] ?? value;
    if (name === "source")
      return APPLICATION_SOURCE_LABELS[value as keyof typeof APPLICATION_SOURCE_LABELS] ?? value;
    if (name === "experience_years") return `${value} tahun`;
    if (name === "last_salary" || name === "expected_salary") return `Rp${value}`;
    return value;
  };

  return (
    <form
      ref={formRef}
      onSubmit={submit}
      onInput={(event) => {
        saveDraft();
        const name = (event.target as HTMLInputElement).name;
        if (name && errors[name]) validateField(name);
      }}
      onBlur={(event) => {
        const target = event.target as unknown as HTMLInputElement;
        if (target.name && target.name !== "consent" && (target.value || errors[target.name])) {
          validateField(target.name);
        }
      }}
      method="post"
      noValidate
      className="mt-8 scroll-mt-6"
    >
      <ol className="relative mb-6 grid grid-cols-4" aria-label="Langkah pengisian">
        <li
          aria-hidden="true"
          className="absolute inset-x-[12.5%] top-[10px] h-1 rounded-full bg-border"
        >
          <div
            className="h-full rounded-full bg-primary transition-[width] duration-300 ease-out motion-reduce:transition-none"
            style={{ width: `${(step / LAST_STEP) * 100}%` }}
          />
        </li>
        {APPLICATION_STEPS.map((item, index) => {
          const done = index < step;
          const current = index === step;
          const dot = (
            <>
              <span className="flex h-6 items-center">
                <span
                  aria-hidden="true"
                  className={cn(
                    "relative z-10 flex items-center justify-center rounded-full border-2",
                    current ? "h-6 w-6 border-sinyal-ink bg-sinyal" : "h-5 w-5",
                    done && "border-primary bg-primary text-primary-foreground",
                    !done && !current && "border-border-strong bg-surface",
                  )}
                >
                  {done && <Check className="h-3 w-3" strokeWidth={3} />}
                </span>
              </span>
              <span
                className={cn(
                  "mt-1.5 text-xs sm:text-sm",
                  current ? "font-semibold" : done ? "" : "text-muted",
                )}
              >
                {item.short}
              </span>
            </>
          );
          return (
            <li
              key={item.title}
              aria-current={current ? "step" : undefined}
              className="relative flex flex-col items-center text-center"
            >
              {done ? (
                <button
                  type="button"
                  onClick={() => goTo(index)}
                  className="flex flex-col items-center rounded-control px-1"
                  aria-label={`Kembali ke langkah ${index + 1}: ${item.title}`}
                >
                  {dot}
                </button>
              ) : (
                dot
              )}
            </li>
          );
        })}
      </ol>

      {restored && (
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-panel bg-primary-soft px-4 py-3 text-sm">
          <span>Isian Anda sebelumnya dipulihkan dari perangkat ini.</span>
          <button
            type="button"
            onClick={clearDraft}
            className="inline-flex items-center gap-1.5 font-semibold text-primary hover:underline"
          >
            <RotateCcw aria-hidden="true" className="h-4 w-4" />
            Mulai dari awal
          </button>
        </div>
      )}

      <div aria-live="polite">
        {message && (
          <div
            ref={errorSummary}
            tabIndex={-1}
            role="alert"
            className="mb-6 rounded-panel border border-danger/30 bg-danger-soft p-4 text-sm text-danger"
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

      <fieldset disabled={pending || !ready} className="space-y-6">
        {section(
          0,
          <div className="grid gap-5 sm:grid-cols-2">
            {input("full_name", { required: true, autoComplete: "name" })}
            {input("whatsapp", {
              type: "tel",
              required: true,
              autoComplete: "tel",
              inputMode: "tel",
              hint: "Dipakai untuk melacak lamaran dan dihubungi tim kami.",
            })}
            {input("email", { type: "email", autoComplete: "email", hint: "Opsional." })}
            {input("city", {
              required: true,
              autoComplete: "street-address",
              hint: "Jalan, kecamatan, dan kota. Contoh: Jl. Melati No. 5, Lowokwaru, Malang.",
              className: "sm:col-span-2",
            })}
          </div>,
        )}
        {section(
          1,
          <div className="grid gap-5 sm:grid-cols-2">
            {select("last_education", EDUCATION_LEVEL_LABELS)}
            {input("major")}
            {input("last_company", { autoComplete: "organization", hint: "Opsional." })}
            {input("last_position", {
              autoComplete: "organization-title",
              hint: "Opsional. Contoh: Staf Admin, Guru Matematika.",
            })}
            {input("experience_years", {
              type: "number",
              required: true,
              inputMode: "numeric",
              hint: "Dalam tahun. Isi 0 jika belum pernah bekerja.",
              className: "sm:col-span-2",
            })}
            {input("last_salary", {
              required: true,
              hint: "Per bulan. Isi 0 jika belum pernah bekerja.",
            })}
            {input("expected_salary", { required: true, hint: "Per bulan." })}
          </div>,
        )}
        {section(
          2,
          <div className="grid gap-5 sm:grid-cols-2">
            {input("cv_url", {
              type: "url",
              inputMode: "url",
              hint: "Opsional. Link https, misalnya Google Drive.",
            })}
            {input("linkedin_url", { type: "url", inputMode: "url", hint: "Opsional." })}
            <Field
              label={LABELS.motivation}
              required
              hint="Minimal 20 karakter."
              error={errors.motivation?.[0]}
              className="sm:col-span-2"
            >
              <textarea
                className="control min-h-32"
                id="motivation"
                name="motivation"
                maxLength={1000}
              />
            </Field>
            {select("availability", AVAILABILITY_LABELS)}
            {select("source", APPLICATION_SOURCE_LABELS)}
            {source === SOURCE_OTHER && input("source_other", { required: true })}
          </div>,
        )}
        {section(
          3,
          <>
            <dl className="space-y-6">
              {APPLICATION_STEPS.slice(0, 3).map((item, index) => (
                <div key={item.title} className="rounded-panel border border-border">
                  <div className="flex items-center justify-between gap-4 border-b border-border px-4 py-3">
                    <p className="font-semibold">{item.title}</p>
                    <button
                      type="button"
                      onClick={() => goTo(index)}
                      className="text-sm font-semibold text-primary hover:underline"
                    >
                      Ubah<span className="sr-only"> {item.title}</span>
                    </button>
                  </div>
                  <div className="grid gap-x-6 sm:grid-cols-2">
                    {item.fields
                      .filter((name) => name !== "source_other" || review.source === SOURCE_OTHER)
                      .map((name) => (
                        <div
                          key={name}
                          className={cn(
                            "border-b border-border px-4 py-2.5 last:border-b-0",
                            name === "motivation" && "sm:col-span-2",
                          )}
                        >
                          <dt className="text-xs text-muted">{LABELS[name]}</dt>
                          <dd className="mt-0.5 whitespace-pre-line break-words text-sm">
                            {name === "whatsapp" ? (
                              <span className="tabular font-semibold">
                                {whatsappNormalized
                                  ? formatWhatsAppDisplay(review.whatsapp)
                                  : review.whatsapp || "—"}
                              </span>
                            ) : (
                              reviewValue(name)
                            )}
                          </dd>
                        </div>
                      ))}
                  </div>
                </div>
              ))}
            </dl>
            <p className="mt-4 rounded-panel bg-sinyal-soft p-4 text-sm text-sinyal-ink">
              Pastikan nomor WhatsApp di atas benar. Nomor ini dipakai untuk melacak lamaran dan
              memulihkan Applicant ID.
            </p>
            <div className="mt-6">
              <label className="flex items-start gap-3 text-sm">
                <input
                  className="mt-0.5 h-4 w-4 shrink-0 accent-primary"
                  type="checkbox"
                  id="consent"
                  name="consent"
                  aria-required="true"
                  aria-invalid={!!errors.consent}
                  aria-describedby={errors.consent ? "consent-error" : undefined}
                  onChange={() => errors.consent && validateField("consent")}
                />
                <span>
                  Saya menyetujui penggunaan data untuk proses rekrutmen sesuai{" "}
                  <Link
                    href="/privasi"
                    target="_blank"
                    className="font-semibold text-primary underline"
                  >
                    kebijakan privasi
                  </Link>
                  . <span className="text-muted">*</span>
                </span>
              </label>
              {errors.consent && (
                <p id="consent-error" className="mt-2 text-sm text-danger">
                  {errors.consent[0]}
                </p>
              )}
            </div>
            <div className="absolute left-[-10000px]" aria-hidden="true">
              <label>
                Website
                <input name="website" tabIndex={-1} autoComplete="off" />
              </label>
            </div>
          </>,
        )}

        <div className="flex flex-wrap-reverse items-center justify-between gap-3">
          {step > 0 ? (
            <button type="button" onClick={() => goTo(step - 1)} className={buttonClass("ghost")}>
              Kembali
            </button>
          ) : (
            <span />
          )}
          {step < LAST_STEP ? (
            <button type="submit" className={buttonClass("primary", "w-full px-6 sm:w-auto")}>
              Lanjut
            </button>
          ) : (
            <button type="submit" className={buttonClass("primary", "w-full px-6 sm:w-auto")}>
              {pending ? "Mengirim lamaran…" : "Kirim lamaran"}
            </button>
          )}
        </div>
      </fieldset>
    </form>
  );
}
