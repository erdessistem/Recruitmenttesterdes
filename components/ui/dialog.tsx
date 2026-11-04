"use client";
import { useEffect, useId, useRef, type ReactNode } from "react";
import { Button } from "./button";

export function Dialog({ open, onClose, title, children }: { open: boolean; onClose: () => void; title: string; children: ReactNode }) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  useEffect(() => { const dialog = ref.current; if (!dialog) return; if (open && !dialog.open) dialog.showModal(); else if (!open && dialog.open) dialog.close(); }, [open]);
  return <dialog ref={ref} aria-labelledby={titleId} onCancel={(event) => { event.preventDefault(); onClose(); }} className="m-auto w-[min(32rem,calc(100%-2rem))] rounded-xl border border-border bg-surface p-6 text-foreground shadow-xl backdrop:bg-black/50"><div className="flex items-start justify-between gap-4"><h2 id={titleId} className="text-lg font-semibold">{title}</h2><Button variant="secondary" onClick={onClose} aria-label="Tutup dialog">×</Button></div><div className="mt-4">{children}</div></dialog>;
}
