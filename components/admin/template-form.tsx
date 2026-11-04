"use client";
import { useState, type FormEvent } from "react";
import type { WhatsAppTemplates } from "@/lib/repositories/types";
import { STAGES, STAGE_LABELS } from "@/lib/constants";
import { saveTemplates } from "@/app/admin/(protected)/pengaturan/actions";
export function TemplateForm({ templates }: { templates: WhatsAppTemplates }) {
  const [message, setMessage] = useState("");
  const [pending, setPending] = useState(false);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setPending(true);
    try {
      setMessage((await saveTemplates(form)).message);
    } catch {
      setMessage("Template belum dapat disimpan.");
    } finally {
      setPending(false);
    }
  }
  return (
    <form onSubmit={submit} className="admin-card mt-6 space-y-5">
      <p className="text-sm text-muted">
        Gunakan variabel {"{nama}"}, {"{posisi}"}, {"{tahap}"}, {"{pesan_tambahan}"},{" "}
        {"{link_lacak}"}, dan {"{applicant_id}"}. Template tahap yang kosong menggunakan template
        utama.
      </p>
      <label className="block text-sm font-semibold">
        Template utama
        <textarea
          name="default"
          rows={8}
          maxLength={4000}
          defaultValue={templates.default}
          className="control mt-2 font-normal"
        />
      </label>
      {STAGES.map((stage) => (
        <label key={stage} className="block text-sm font-semibold">
          {STAGE_LABELS[stage]} (opsional)
          <textarea
            name={stage}
            rows={4}
            maxLength={4000}
            defaultValue={templates.byStage?.[stage] ?? ""}
            className="control mt-2 font-normal"
          />
        </label>
      ))}
      {message && (
        <p role="status" className="text-sm text-primary">
          {message}
        </p>
      )}
      <button
        disabled={pending}
        className="rounded-control bg-primary px-5 py-3 font-semibold text-white disabled:opacity-50"
      >
        {pending ? "Menyimpan…" : "Simpan template"}
      </button>
    </form>
  );
}
