"use client";
import { useEffect, useId, useRef, type ReactNode } from "react";
import { X } from "lucide-react";
import { buttonClass } from "./button";

/** Native modal dialog: focus trap, Escape and the backdrop come from the browser. */
export function Dialog({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    else if (!open && dialog.open) dialog.close();
  }, [open]);
  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      className="m-auto w-[min(32rem,calc(100%-2rem))] rounded-panel border border-border bg-surface p-6 text-foreground shadow-xl transition-[opacity,transform] duration-200 ease-[cubic-bezier(0.23,1,0.32,1)] backdrop:bg-ink/50 starting:scale-[0.96] starting:opacity-0 motion-reduce:transition-none"
    >
      <div className="flex items-start justify-between gap-4">
        <h2 id={titleId} className="text-lg font-bold">
          {title}
        </h2>
        <button
          type="button"
          onClick={onClose}
          aria-label="Tutup dialog"
          className={buttonClass("ghost", "-mr-2 -mt-2 min-h-10 px-2.5")}
        >
          <X aria-hidden="true" className="h-5 w-5" />
        </button>
      </div>
      <div className="mt-3">{children}</div>
    </dialog>
  );
}
