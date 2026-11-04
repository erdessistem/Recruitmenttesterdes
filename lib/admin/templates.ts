import { STAGE_LABELS } from "@/lib/constants";
import type { Application, Vacancy, Settings } from "@/lib/repositories/types";
export function createWhatsAppMessage(application: Application, vacancy: Vacancy | null, settings: Settings, appUrl: string) {
  const template = settings.waTemplates.byStage?.[application.currentStage] || settings.waTemplates.default;
  const values: Record<string, string> = { nama: application.fullName, posisi: vacancy?.title ?? "", tahap: STAGE_LABELS[application.currentStage], link_lacak: application.token ? `${appUrl.replace(/\/$/, "")}/lacak/${encodeURIComponent(application.token)}` : "", applicant_id: application.id };
  return template.replace(/\{(nama|posisi|tahap|link_lacak|applicant_id)\}/g, (_, key: string) => values[key]);
}
