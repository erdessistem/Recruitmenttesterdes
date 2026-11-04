import { requireAdmin } from "@/lib/auth/session";
import { repository } from "@/lib/repositories";
import { TemplateForm } from "@/components/admin/template-form";
import { CompanyForm, PasswordForm, RetentionForm } from "@/components/admin/settings-forms";
import { isRetentionEligible } from "@/lib/admin/retention";
export const metadata = { title: "Pengaturan" };
export default async function SettingsPage() {
  await requireAdmin();
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
      <CompanyForm profile={settings.companyProfile} />
      <PasswordForm />
      <RetentionForm eligible={eligible} months={settings.retentionMonths} />
      <h2 className="mt-10 text-2xl font-bold">Template WhatsApp</h2>
      <p className="mt-2 text-muted">Sesuaikan pesan yang dapat disalin dari detail pelamar.</p>
      <TemplateForm templates={settings.waTemplates} />
    </div>
  );
}
