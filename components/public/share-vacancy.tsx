"use client";
import { useEffect, useState } from "react";
import { Check, Link2, MessageCircle, Share2 } from "lucide-react";
import { buttonClass } from "@/components/ui/button";

export function ShareVacancy({ title }: { title: string }) {
  const [url, setUrl] = useState("");
  const [canShare, setCanShare] = useState(false);
  const [copied, setCopied] = useState(false);
  useEffect(() => {
    setUrl(window.location.href.split("#")[0]);
    setCanShare(typeof navigator.share === "function");
  }, []);
  useEffect(() => {
    if (!copied) return;
    const timer = setTimeout(() => setCopied(false), 2000);
    return () => clearTimeout(timer);
  }, [copied]);
  const text = `Lowongan ${title} di Erdes Group`;
  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
    } catch {
      window.prompt("Salin link lowongan:", url);
    }
  }
  return (
    <div className="flex flex-wrap gap-2">
      <a
        className={buttonClass("secondary", "min-h-10 flex-1")}
        href={`https://wa.me/?text=${encodeURIComponent(`${text}\n${url}`)}`}
        target="_blank"
        rel="noopener noreferrer"
      >
        <MessageCircle aria-hidden="true" className="h-4 w-4" />
        WhatsApp
      </a>
      <button type="button" className={buttonClass("secondary", "min-h-10 flex-1")} onClick={copy}>
        {copied ? (
          <Check aria-hidden="true" className="h-4 w-4" />
        ) : (
          <Link2 aria-hidden="true" className="h-4 w-4" />
        )}
        {copied ? "Disalin" : "Salin link"}
      </button>
      {canShare && (
        <button
          type="button"
          className={buttonClass("secondary", "min-h-10 px-3")}
          aria-label="Bagikan lewat aplikasi lain"
          onClick={() => navigator.share({ title: text, url }).catch(() => {})}
        >
          <Share2 aria-hidden="true" className="h-4 w-4" />
        </button>
      )}
      <span className="sr-only" role="status" aria-live="polite">
        {copied ? "Link lowongan disalin." : ""}
      </span>
    </div>
  );
}
