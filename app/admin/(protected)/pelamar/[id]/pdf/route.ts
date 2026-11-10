import { notFound } from "next/navigation";
import { requireRole } from "@/lib/auth/session";
import { repository } from "@/lib/repositories";
import { applicantPdfModel } from "@/lib/admin/applicant-pdf-model";
import { renderApplicantPdf } from "@/lib/admin/applicant-pdf";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireRole("hr");
  const { id } = await params;
  const data = await repository.getApplicantWorkspace(id);
  if (!data) notFound();

  const model = applicantPdfModel({ ...data, printedBy: admin.name || admin.email });
  const pdf = await renderApplicantPdf(model);
  return new Response(new Uint8Array(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${model.fileName}"`,
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
