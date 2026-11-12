"use client";
import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";

const ToastContext = createContext<((message: string) => void) | null>(null);
export function ToastProvider({ children }: { children: ReactNode }) {
  const [toast, setToast] = useState<{ id: number; message: string } | null>(null);
  const show = useCallback((message: string) => setToast({ id: Date.now(), message }), []);
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 5000);
    return () => clearTimeout(timer);
  }, [toast]);
  return (
    <ToastContext.Provider value={show}>
      {children}
      <div className="on-dark fixed bottom-4 right-4 z-50" role="status" aria-live="polite">
        {toast && (
          <div
            key={toast.id}
            className="rounded-chip bg-navy px-4 py-3 text-sm font-medium text-white transition-[opacity,transform] duration-300 ease-out starting:translate-y-full starting:opacity-0 motion-reduce:transition-none"
          >
            {toast.message}
          </div>
        )}
      </div>
    </ToastContext.Provider>
  );
}
export function useToast() {
  const show = useContext(ToastContext);
  if (!show) throw new Error("useToast requires ToastProvider");
  return show;
}
