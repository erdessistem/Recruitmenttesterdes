import Link from "next/link";
import { ChevronDown } from "lucide-react";
import { repository } from "@/lib/repositories";
import { about, faq } from "@/lib/content/careers";
import { buttonClass } from "@/components/ui/button";
import { ScamNotice } from "@/components/public/scam-notice";
import { VacancyBrowser } from "@/components/public/vacancy-browser";
import { formatSalaryRange } from "@/lib/format/currency";

export const dynamic = "force-dynamic";

const steps = [
  { title: "Lamar online", body: "Isi formulir sekitar 5 menit. Tidak perlu membuat akun." },
  { title: "Simpan Applicant ID", body: "Anda langsung menerima ID dan link lacak pribadi." },
  { title: "Lacak status", body: "Cek tahap lamaran kapan saja dengan ID dan nomor WhatsApp." },
];

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; department?: string; location?: string; type?: string }>;
}) {
  const filters = await searchParams;
  const { vacancies, companyProfile } = await repository.getHomePageData();
  const showAbout = Boolean(about.intro || about.benefits.length);

  return (
    <main>
      <section className="border-b border-border bg-surface">
        <div className="mx-auto grid max-w-6xl gap-12 px-4 py-14 sm:px-6 sm:py-20 lg:grid-cols-[1.1fr_1fr] lg:items-end">
          <div>
            <h1 className="max-w-xl text-4xl font-bold leading-[1.1] tracking-tight sm:text-5xl">
              Langkah berikutnya dimulai di sini.
            </h1>
            <p className="mt-5 max-w-md text-lg leading-relaxed text-muted">
              Temukan kesempatan untuk bertumbuh dan berkarya bersama Erdes Group.
            </p>
            <a href="#lowongan" className={buttonClass("primary", "mt-8 px-5")}>
              Lihat {vacancies.length} lowongan terbuka
            </a>
          </div>
          <ol aria-label="Cara melamar" className="relative space-y-6">
            <li
              aria-hidden="true"
              className="absolute bottom-[34px] left-[10px] top-2 w-1 rounded-full bg-primary-soft"
            />
            {steps.map((step, index) => (
              <li key={step.title} className="relative flex gap-4">
                <span
                  aria-hidden="true"
                  className={
                    index === 0
                      ? "relative z-10 mt-0.5 h-6 w-6 shrink-0 rounded-full border-2 border-sinyal-ink bg-sinyal"
                      : "relative z-10 mx-1 mt-1.5 h-4 w-4 shrink-0 rounded-full border-2 border-primary bg-surface"
                  }
                />
                <div>
                  <p className="font-semibold">{step.title}</p>
                  <p className="mt-0.5 text-sm leading-relaxed text-muted">{step.body}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section id="lowongan" className="mx-auto max-w-6xl scroll-mt-4 px-4 py-14 sm:px-6">
        <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">Lowongan terbuka</h2>
        <VacancyBrowser
          vacancies={vacancies.map((v) => ({
            id: v.id,
            slug: v.slug,
            title: v.title,
            department: v.department,
            location: v.location,
            employmentType: v.employmentType,
            closeAt: v.closeAt,
            salary: v.salaryVisible ? formatSalaryRange(v.salaryMin, v.salaryMax) : null,
          }))}
          initial={{
            q: filters.q ?? "",
            department: filters.department ?? "",
            location: filters.location ?? "",
            type: filters.type ?? "",
          }}
          now={Date.now()}
        />
        <ScamNotice className="mt-6" whatsapp={companyProfile.contactWhatsapp} />
      </section>

      {showAbout && (
        <section className="border-t border-border bg-surface">
          <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
            <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">Tentang Erdes Group</h2>
            {about.intro && (
              <p className="mt-4 max-w-[65ch] text-lg leading-relaxed text-muted">{about.intro}</p>
            )}
            {about.benefits.length > 0 && (
              <ul className="mt-8 grid gap-x-10 gap-y-6 sm:grid-cols-2">
                {about.benefits.map((benefit) => (
                  <li key={benefit.title} className="border-l-4 border-primary pl-4">
                    <p className="font-semibold">{benefit.title}</p>
                    <p className="mt-1 text-sm leading-relaxed text-muted">{benefit.body}</p>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>
      )}

      <section className="border-t border-border">
        <div className="mx-auto grid max-w-6xl gap-8 px-4 py-14 sm:px-6 lg:grid-cols-[1fr_2fr]">
          <div>
            <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">Pertanyaan umum</h2>
            <p className="mt-3 text-muted">Hal yang paling sering ditanyakan pelamar.</p>
          </div>
          <div className="divide-y divide-border rounded-panel border border-border bg-surface">
            {faq.map((item) => (
              <details key={item.question} className="group">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-5 py-4 font-semibold hover:bg-paper [&::-webkit-details-marker]:hidden">
                  {item.question}
                  <ChevronDown
                    aria-hidden="true"
                    className="h-5 w-5 shrink-0 text-muted transition-transform duration-200 ease-out group-open:rotate-180 motion-reduce:transition-none"
                  />
                </summary>
                <div className="px-5 pb-5 text-sm leading-relaxed text-muted">
                  <p className="max-w-[65ch]">{item.answer}</p>
                  {item.link && (
                    <Link
                      href={item.link.href}
                      className="mt-2 inline-block font-semibold text-primary hover:underline"
                    >
                      {item.link.label}
                    </Link>
                  )}
                </div>
              </details>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
