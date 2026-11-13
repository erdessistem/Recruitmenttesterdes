import Link from "next/link";
import { ChevronDown } from "lucide-react";
import { repository } from "@/lib/repositories";
import { about, faq } from "@/lib/content/careers";
import { Mascot } from "@/components/brand/mascot";
import { buttonClass } from "@/components/ui/button";
import { ScamNotice } from "@/components/public/scam-notice";
import { VacancyBrowser } from "@/components/public/vacancy-browser";
import { formatSalaryRange } from "@/lib/format/currency";

export const dynamic = "force-dynamic";

const steps = [
  { title: "Lamar online", body: "Isi formulir sekitar 5 menit. Tidak perlu membuat akun." },
  { title: "Simpan Applicant ID", body: "Anda langsung menerima ID dan link lacak pribadi." },
  { title: "Lacak status", body: "Cek tahap lamaran kapan saja dengan Applicant ID Anda." },
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
      <section className="mx-auto grid max-w-6xl gap-10 px-4 pb-16 pt-8 sm:px-6 sm:pt-12 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)] lg:items-center lg:gap-14">
        <div>
          {/* The kit's two-part headline: the second half carries the point, in terracotta. */}
          <h1 className="text-display">
            Langkah berikutnya <span className="block text-terracotta">dimulai di sini.</span>
          </h1>
          <p className="mt-6 max-w-md text-lg leading-relaxed text-muted">
            Temukan kesempatan untuk bertumbuh dan berkarya bersama PT Erdes Desa Maju Bersama.
          </p>
          <a href="#lowongan" className={buttonClass("primary", "mt-8")}>
            Lihat {vacancies.length} lowongan terbuka
          </a>
        </div>
        {/* Kio stands on the panel's top edge: he greets, and sleeps when nothing is open. */}
        <div className="relative pt-[118px]">
          <Mascot
            animation={vacancies.length ? "wave" : "sleep"}
            size={120}
            className="absolute right-8 top-0"
          />
          <div className="rounded-panel bg-sand p-6 sm:p-8">
            <ol aria-label="Cara melamar" className="relative space-y-5">
              <li
                aria-hidden="true"
                className="absolute bottom-[30px] left-[10px] top-2 w-1 rounded-full bg-white"
              />
              {steps.map((step, index) => (
                <li key={step.title} className="relative flex gap-4">
                  <span
                    aria-hidden="true"
                    className={
                      index === 0
                        ? "relative z-10 mt-0.5 h-6 w-6 shrink-0 rounded-full border-2 border-navy bg-marigold"
                        : "relative z-10 mx-1 mt-1.5 h-4 w-4 shrink-0 rounded-full border-2 border-navy bg-white"
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
        </div>
      </section>

      <section id="lowongan" className="mx-auto max-w-6xl scroll-mt-6 px-4 pb-16 sm:px-6">
        <h2 className="text-h1">Lowongan terbuka</h2>
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
        <section className="bg-sand">
          <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
            <h2 className="text-h1">Tentang PT Erdes Desa Maju Bersama</h2>
            {about.intro && (
              <p className="mt-4 max-w-[65ch] text-lg leading-relaxed">{about.intro}</p>
            )}
            {about.benefits.length > 0 && (
              <ul className="mt-10 divide-y divide-navy/15 border-t border-navy/15">
                {about.benefits.map((benefit) => (
                  <li
                    key={benefit.title}
                    className="grid gap-2 py-5 sm:grid-cols-[18rem_minmax(0,1fr)] sm:gap-8"
                  >
                    <p className="font-display text-h3">{benefit.title}</p>
                    <p className="max-w-[65ch] leading-relaxed text-muted">{benefit.body}</p>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>
      )}

      <section className="mx-auto grid max-w-6xl gap-8 px-4 py-16 sm:px-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]">
        <div>
          <h2 className="text-h1">Pertanyaan umum</h2>
          <p className="mt-3 text-muted">Hal yang paling sering ditanyakan pelamar.</p>
        </div>
        <div className="divide-y divide-border overflow-hidden rounded-panel border border-border bg-surface">
          {faq.map((item) => (
            <details key={item.question} className="group">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-5 py-4 font-semibold hover:bg-cream focus-visible:-outline-offset-3 [&::-webkit-details-marker]:hidden">
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
      </section>
    </main>
  );
}
