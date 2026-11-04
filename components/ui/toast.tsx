"use client";
import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";

const ToastContext = createContext<((message: string) => void) | null>(null);
export function ToastProvider({ children }: { children: ReactNode }) {
  const [toast, setToast] = useState<{ id: number; message: string } | null>(null);
  const show = useCallback((message: string) => setToast({ id: Date.now(), message }), []);
  useEffect(() => { if (!toast) return; const timer = setTimeout(() => setToast(null), 5000); return () => clearTimeout(timer); }, [toast]);
  return <ToastContext.Provider value={show}>{children}<div className="fixed bottom-4 right-4 z-50" role="status" aria-live="polite">{toast && <div className="rounded-control bg-foreground px-4 py-3 text-sm text-white shadow-lg">{toast.message}</div>}</div></ToastContext.Provider>;
}
export function useToast() { const show = useContext(ToastContext); if (!show) throw new Error("useToast requires ToastProvider"); return show; }
