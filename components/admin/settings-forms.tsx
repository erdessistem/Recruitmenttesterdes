"use client";
import { useState, type FormEvent } from "react";
import type { CompanyProfile } from "@/lib/repositories/types";
import {
  changePassword,
  runRetention,
  saveCompany,
} from "@/app/admin/(protected)/pengaturan/actions";
import { useRouter } from "next/navigation";

const button = "rounded-control bg-primary px-5 py-3 font-semibold text-white disabled:opacity-50";
export function CompanyForm({ profile }: { profile: CompanyProfile }) {
  const [message, setMessage] = useState("");
  const [pending, setPending] = useState(false);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setPending(true);
    try {
      setMessage((await saveCompany(form)).message);
    } catch {
      setMessage("Profil belum dapat disimpan.");
    } finally {
      setPending(false);
    }
  }
  return (
    <form onSubmit={submit} className="admin-card mt-6 space-y-4">
      <h2 className="text-lg font-bold">Profil perusahaan</h2>
      {(
        [
          ["name", "Nama perusahaan", profile.name],
          ["address", "Alamat", profile.address],
          ["contactEmail", "Email kontak", profile.contactEmail],
          ["contactWhatsapp", "WhatsApp kontak", profile.contactWhatsapp],
        ] as const
      ).map(([name, label, value]) => (
        <label key={name} className="block text-sm font-semibold">
          {label}
          <input
            className="control mt-2 font-normal"
            name={name}
            defaultValue={value}
            type={name === "contactEmail" ? "email" : name === "contactWhatsapp" ? "tel" : "text"}
          />
        </label>
      ))}
      {message && (
        <p role="status" className="text-sm">
          {message}
        </p>
      )}
      <button className={button} disabled={pending}>
        Simpan profil
      </button>
    </form>
  );
}
export function PasswordForm() {
  const [message, setMessage] = useState("");
  const [pending, setPending] = useState(false);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const target = event.currentTarget;
    const form = new FormData(target);
    setPending(true);
    try {
      const result = await changePassword(form);
      setMessage(result.message);
      if (result.ok) target.reset();
    } catch {
      setMessage("Password belum dapat diubah.");
    } finally {
      setPending(false);
    }
  }
  return (
    <form onSubmit={submit} className="admin-card mt-6 space-y-4">
      <h2 className="text-lg font-bold">Ubah password</h2>
      {(
        [
          ["current", "Password saat ini", "current-password"],
          ["password", "Password baru", "new-password"],
          ["confirmation", "Ulangi password baru", "new-password"],
        ] as const
      ).map(([name, label, autocomplete]) => (
        <label key={name} className="block text-sm font-semibold">
          {label}
          <input
            className="control mt-2 font-normal"
            type="password"
            name={name}
            required
            autoComplete={autocomplete}
          />
        </label>
      ))}
      {message && (
        <p role="status" className="text-sm">
          {message}
        </p>
      )}
      <button className={button} disabled={pending}>
        Ubah password
      </button>
    </form>
  );
}
export function RetentionForm({ eligible, months }: { eligible: number; months: number }) {
  const [confirmation, setConfirmation] = useState("");
  const [message, setMessage] = useState("");
  const [pending, setPending] = useState(false);
  const router = useRouter();
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    try {
      const result = await runRetention(confirmation);
      setMessage(result.message);
      if (result.ok) {
        setConfirmation("");
        router.refresh();
      }
    } catch {
      setMessage("Pembersihan belum selesai.");
    } finally {
      setPending(false);
    }
  }
  return (
    <form onSubmit={submit} className="admin-card mt-6 space-y-4">
      <h2 className="text-lg font-bold">Pembersihan retensi</h2>
      <p className="text-sm text-muted">
        {eligible} lamaran ditolak atau ditarik telah ditutup lebih dari {months} bulan dan siap
        dianonimkan. Pembersihan menghapus data identitas dan catatan; riwayat versi dan cadangan
        terpisah mungkin masih menyimpan data.
      </p>
      <label className="block text-sm font-semibold">
        Ketik ANONIMKAN untuk mengonfirmasi
        <input
          className="control mt-2 font-normal"
          value={confirmation}
          onChange={(event) => setConfirmation(event.target.value)}
          autoComplete="off"
        />
      </label>
      {message && (
        <p role="status" className="text-sm">
          {message}
        </p>
      )}
      <button
        className={button}
        disabled={pending || eligible === 0 || confirmation !== "ANONIMKAN"}
      >
        Anonimkan lamaran
      </button>
    </form>
  );
}
