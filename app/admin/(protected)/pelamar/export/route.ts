import { requireRole } from "@/lib/auth/session";
import { repository } from "@/lib/repositories";
import { toRepositoryFilters } from "@/lib/admin/filters";
import { applicantsCsv } from "@/lib/admin/csv";
import { formatJakartaDateKey } from "@/lib/format/date";
export const dynamic = "force-dynamic";
export async function GET(request: Request) {
  await requireRole("hr");
  const query = new URL(request.url).searchParams;
  const filters = Object.fromEntries(
    ["q", "vacancy", "stage", "status", "from", "to"].map((k) => [k, query.get(k) ?? undefined]),
  );
  const [applications, vacancies] = await Promise.all([
    repository.getApplications(toRepositoryFilters(filters)),
    repository.getVacancies(),
  ]);
  const slug = vacancies.find((v) => v.id === filters.vacancy)?.slug ?? "all";
  const safeSlug = slug.replace(/[^a-z0-9-]/g, "").slice(0, 120) || "all";
  return new Response(applicantsCsv(applications, vacancies), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="pelamar-${safeSlug}-${formatJakartaDateKey()}.csv"`,
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
