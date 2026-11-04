"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { lookup, recover, reveal, withdraw } from "@/app/(public)/lacak/actions";
import { formatDate } from "@/lib/format/date";
import { buttonClass } from "@/components/ui/button";

function Values({ names = false }: { names?: boolean }) {
  return (
    <>
      <label className="block text-sm font-semibold">
        {names ? "Nama lengkap" : "Applicant ID"}
        <input
          className="control mt-2 font-normal"
          name={names ? "full_name" : "applicant_id"}
          required
          autoComplete={names ? "name" : "off"}
        />
      </label>
      <label className="block text-sm font-semibold">
        No. WhatsApp
        <input
          className="control mt-2 font-normal"
          name="whatsapp"
          type="tel"
          required
          autoComplete="tel"
        />
      </label>
    </>
  );
}
const button = buttonClass("primary", "w-full sm:w-auto");
export function LookupForm() {
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const router = useRouter();
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    setPending(true);
    setError("");
    try {
      const result = await lookup({
        applicant_id: String(data.get("applicant_id") ?? ""),
        whatsapp: String(data.get("whatsapp") ?? ""),
      });
      if (result.ok) router.push(`/lacak/${encodeURIComponent(result.token)}`);
      else {
        setError(result.message);
        setPending(false);
      }
    } catch {
      setError("Terjadi kesalahan. Silakan coba lagi.");
      setPending(false);
    }
  }
  return (
    <form onSubmit={submit} className="mt-6 space-y-4">
      <Values />
      {error && (
        <p role="alert" className="text-sm text-danger">
          {error}
        </p>
      )}
      <button className={button} disabled={pending}>
        {pending ? "Mencari…" : "Lacak lamaran"}
      </button>
    </form>
  );
}
type RecoveryItem = { handle: string; maskedId: string; vacancy: string; appliedAt: string };
export function RecoveryForm() {
  const [items, setItems] = useState<RecoveryItem[] | null>(null);
  const [shown, setShown] = useState<Record<string, string>>({});
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const [confirm, setConfirm] = useState<string | null>(null);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    setPending(true);
    setItems(null);
    setShown({});
    setConfirm(null);
    setError("");
    try {
      const result = await recover({
        full_name: String(data.get("full_name") ?? ""),
        whatsapp: String(data.get("whatsapp") ?? ""),
      });
      if (result.ok) setItems(result.results);
      else setError(result.message);
    } catch {
      setError("Terjadi kesalahan. Silakan coba lagi.");
    } finally {
      setPending(false);
    }
  }
  async function show(handle: string) {
    setPending(true);
    try {
      const id = await reveal(handle);
      if (id) setShown((previous) => ({ ...previous, [handle]: id }));
      else setError("Konfirmasi telah kedaluwarsa. Silakan cari kembali.");
      setConfirm(null);
    } catch {
      setError("Terjadi kesalahan. Silakan cari kembali.");
    } finally {
      setPending(false);
    }
  }
  return (
    <>
      <form onSubmit={submit} className="mt-6 space-y-4">
        <Values names />
        {error && (
          <p role="alert" className="text-sm text-danger">
            {error}
          </p>
        )}
        <button className={button} disabled={pending}>
          {pending ? "Mencari…" : "Cari lamaran"}
        </button>
      </form>
      {items && (
        <div className="mt-8">
          <h2 className="text-lg font-bold">Hasil pencarian</h2>
          {items.length === 0 ? (
            <p className="mt-3 text-sm text-muted">
              Tidak ada lamaran yang cocok. Periksa kembali data Anda.
            </p>
          ) : (
            <ul className="mt-4 space-y-3">
              {items.map((item) => (
                <li key={item.handle} className="rounded-panel border border-border p-4">
                  <p className="font-semibold">{item.vacancy}</p>
                  <p className="mt-1 text-sm text-muted">{formatDate(item.appliedAt)}</p>
                  <p className="tabular mt-2 break-all text-sm font-semibold">
                    {shown[item.handle] ?? item.maskedId}
                  </p>
                  {shown[item.handle] ? (
                    <Link
                      href="/lacak"
                      className="mt-3 inline-block text-sm font-semibold text-primary underline"
                    >
                      Lanjut ke pelacakan
                    </Link>
                  ) : confirm === item.handle ? (
                    <div className="mt-3">
                      <p className="text-sm">Tampilkan Applicant ID lengkap untuk lamaran ini?</p>
                      <div className="mt-2 flex gap-3">
                        <button
                          type="button"
                          disabled={pending}
                          onClick={() => show(item.handle)}
                          className={buttonClass("primary")}
                        >
                          Ya, tampilkan
                        </button>
                        <button
                          type="button"
                          onClick={() => setConfirm(null)}
                          className={buttonClass("ghost")}
                        >
                          Batal
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setConfirm(item.handle)}
                      className="mt-3 text-sm font-semibold text-primary underline"
                    >
                      Tampilkan Applicant ID
                    </button>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </>
  );
}
export function WithdrawalForm({ token }: { token: string }) {
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState("");
  const router = useRouter();
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    setPending(true);
    setMessage("");
    try {
      const result = await withdraw(token, {
        applicant_id: String(data.get("applicant_id") ?? ""),
        whatsapp: String(data.get("whatsapp") ?? ""),
      });
      setMessage(result.message);
      if (result.ok) {
        setOpen(false);
        router.refresh();
      }
    } catch {
      setMessage("Terjadi kesalahan. Silakan coba lagi.");
    } finally {
      setPending(false);
    }
  }
  return (
    <section className="mt-10 border-t border-border pt-8">
      <h2 className="text-lg font-bold">Tarik lamaran</h2>
      <p className="mt-2 text-sm text-muted">
        Anda dapat mengundurkan diri dari proses rekrutmen ini.
      </p>
      {!open ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="mt-4 text-sm font-semibold text-danger underline"
        >
          Saya ingin menarik lamaran
        </button>
      ) : (
        <form onSubmit={submit} className="mt-4 space-y-4">
          <p className="text-sm">
            Konfirmasikan identitas Anda. Lamaran yang ditarik tidak dapat dibuka kembali melalui
            portal.
          </p>
          <Values />
          <label className="flex gap-2 text-sm">
            <input type="checkbox" required /> Saya yakin ingin menarik lamaran ini.
          </label>
          <div className="flex flex-wrap gap-3">
            <button className={buttonClass("danger")} disabled={pending}>
              {pending ? "Memproses…" : "Tarik lamaran"}
            </button>
            <button type="button" onClick={() => setOpen(false)} className={buttonClass("ghost")}>
              Batal
            </button>
          </div>
        </form>
      )}
      {message && (
        <p role="status" className="mt-3 text-sm">
          {message}
        </p>
      )}
    </section>
  );
}
