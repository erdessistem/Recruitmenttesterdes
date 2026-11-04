"use client";
import { useEffect, useState } from "react";
export function SuccessActions({ id, token }: { id: string; token: string }) {
  const [message, setMessage] = useState("");
  const [url, setUrl] = useState("");
  useEffect(() => setUrl(`${window.location.origin}/lacak/${encodeURIComponent(token)}`), [token]);
  async function copy(value: string) {
    try {
      await navigator.clipboard.writeText(value);
      setMessage("Berhasil disalin.");
    } catch {
      setMessage("Tidak dapat menyalin. Silakan salin secara manual.");
    }
  }
  return (
    <div className="no-print mt-8">
      <p className="mb-2 text-sm font-semibold">Link lacak pribadi</p>
      <p className="break-all rounded-control border border-border p-3 text-sm">
        {url || `/lacak/${token}`}
      </p>
      <p className="mt-2 text-xs text-muted">
        Simpan link ini dan jangan bagikan kepada orang lain.
      </p>
      <div className="mt-5 flex flex-wrap gap-3">
        <button type="button" className="action-button" onClick={() => copy(id)}>
          Salin Applicant ID
        </button>
        <button type="button" className="action-button" onClick={() => copy(url)}>
          Salin link lacak
        </button>
        <a
          className="action-button"
          href={`https://wa.me/?text=${encodeURIComponent(`Applicant ID: ${id}\nLink lacak: ${url}`)}`}
          target="_blank"
          rel="noopener noreferrer"
        >
          Kirim ke WhatsApp saya
        </a>
        <button type="button" className="action-button" onClick={() => window.print()}>
          Cetak / simpan bukti
        </button>
        <a className="action-button" href={`/lacak/${token}`}>
          Lacak lamaran
        </a>
      </div>
      <p className="mt-3 text-sm text-primary" role="status">
        {message}
      </p>
    </div>
  );
}
