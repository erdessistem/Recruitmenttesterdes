"use client";
import { useEffect, useState } from "react";
import { Check, Copy, MessageCircle, Printer } from "lucide-react";
import { buttonClass } from "@/components/ui/button";

export function SuccessActions({ id, token }: { id: string; token: string }) {
  const [copied, setCopied] = useState<"id" | "url" | null>(null);
  const [error, setError] = useState("");
  const [url, setUrl] = useState("");
  useEffect(() => setUrl(`${window.location.origin}/lacak/${encodeURIComponent(token)}`), [token]);
  useEffect(() => {
    if (!copied) return;
    const timer = setTimeout(() => setCopied(null), 2000);
    return () => clearTimeout(timer);
  }, [copied]);
  async function copy(value: string, which: "id" | "url") {
    try {
      await navigator.clipboard.writeText(value);
      setError("");
      setCopied(which);
    } catch {
      setError("Tidak dapat menyalin. Salin secara manual.");
    }
  }
  const copyIcon = (active: boolean) =>
    active ? <Check aria-hidden="true" className="h-4 w-4" /> : <Copy aria-hidden="true" className="h-4 w-4" />;
  return (
    <div className="no-print mt-10 border-t border-border pt-8">
      <h2 className="text-lg font-bold">Simpan bukti lamaran</h2>
      <div className="mt-4 flex flex-wrap gap-3">
        <button type="button" className={buttonClass("primary")} onClick={() => copy(id, "id")}>
          {copyIcon(copied === "id")}
          {copied === "id" ? "ID disalin" : "Salin Applicant ID"}
        </button>
        <a
          className={buttonClass("secondary")}
          href={`https://wa.me/?text=${encodeURIComponent(`Applicant ID: ${id}\nLink lacak: ${url}`)}`}
          target="_blank"
          rel="noopener noreferrer"
        >
          <MessageCircle aria-hidden="true" className="h-4 w-4" />
          Kirim ke WhatsApp saya
        </a>
        <button type="button" className={buttonClass("secondary")} onClick={() => window.print()}>
          <Printer aria-hidden="true" className="h-4 w-4" />
          Cetak bukti
        </button>
      </div>

      <h3 className="mt-8 text-sm font-semibold">Link lacak pribadi</h3>
      <div className="mt-2 flex items-stretch gap-2">
        <p className="min-w-0 flex-1 break-all rounded-control border border-border bg-paper px-3 py-2.5 text-sm">
          {url || `/lacak/${token}`}
        </p>
        <button
          type="button"
          className={buttonClass("secondary", "shrink-0")}
          onClick={() => copy(url, "url")}
          aria-label="Salin link lacak"
        >
          {copyIcon(copied === "url")}
          <span className="hidden sm:inline">{copied === "url" ? "Disalin" : "Salin"}</span>
        </button>
      </div>
      <p className="mt-2 text-xs text-muted">
        Link ini membuka status lamaran Anda tanpa login. Jangan bagikan kepada orang lain.
      </p>
      <a href={`/lacak/${token}`} className={buttonClass("ghost", "-ml-4 mt-4 text-primary")}>
        Buka halaman lacak
      </a>
      <p className="sr-only" role="status" aria-live="polite">
        {copied === "id" ? "Applicant ID disalin." : copied === "url" ? "Link lacak disalin." : ""}
      </p>
      {error && (
        <p className="mt-3 text-sm text-danger" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
