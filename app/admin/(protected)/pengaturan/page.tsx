import Link from "next/link";
import { ChevronRight, Users } from "lucide-react";
import { requireAdmin } from "@/lib/auth/session";
import { canManage } from "@/lib/auth/roles";
import { repository } from "@/lib/repositories";
import { TemplateForm } from "@/components/admin/template-form";
import { CompanyForm, PasswordForm, RetentionForm } from "@/components/admin/settings-forms";
import { isRetentionEligible } from "@/lib/admin/retention";
import { ADMIN_ROLE_LABELS } from "@/lib/constants";

export const metadata = { title: "Pengaturan" };

export default async function SettingsPage() {
  const admin = await requireAdmin();

  // HR and viewers only manage their own password here.
  if (!canManage(admin.role)) {
    return (
      <div className="mx-auto max-w-4xl">
        <h1 className="text-3xl font-bold tracking-tight">Akun saya</h1>
        <p className="mt-2 text-muted">
          {admin.name}, {admin.email}. Peran: {ADMIN_ROLE_LABELS[admin.role]}.
        </p>
        <PasswordForm />
      </div>
    );
  }

  const [settings, applications] = await Promise.all([
    repository.getSettings(),
    repository.getApplications(),
  ]);
  const eligible = applications.filter((application) =>
    isRetentionEligible(application, settings.retentionMonths),
  ).length;
  return (
    <div className="mx-auto max-w-4xl">
      <h1 className="text-3xl font-bold tracking-tight">Pengaturan</h1>
      <Link
        href="/admin/pengaturan/akun"
        className="admin-card mt-6 flex items-center gap-4 transition-colors hover:bg-paper motion-reduce:transition-none"
      >
        <Users aria-hidden="true" className="h-5 w-5 shrink-0 text-primary" />
        <span className="min-w-0 flex-1">
          <span className="block font-bold">Akun admin</span>
          <span className="block text-sm text-muted">
            Tambah akun HR atau Viewer, ubah peran, reset password, nonaktifkan akun.
          </span>
        </span>
        <ChevronRight aria-hidden="true" className="h-5 w-5 shrink-0 text-muted" />
      </Link>
      <CompanyForm profile={settings.companyProfile} />
      <PasswordForm />
      <RetentionForm eligible={eligible} months={settings.retentionMonths} />
      <h2 className="mt-10 text-2xl font-bold">Template WhatsApp</h2>
      <p className="mt-2 text-muted">Sesuaikan pesan yang dapat disalin dari detail pelamar.</p>
      <TemplateForm templates={settings.waTemplates} />
    </div>
  );
}
