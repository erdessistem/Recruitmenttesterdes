"use client";
import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { KeyRound, UserPlus } from "lucide-react";
import {
  ADMIN_ROLES,
  ADMIN_ROLE_DESCRIPTIONS,
  ADMIN_ROLE_LABELS,
  type AdminRole,
} from "@/lib/constants";
import { formatDateTime } from "@/lib/format/date";
import {
  addAdminAccount,
  resetAdminPassword,
  updateAdminAccount,
} from "@/app/admin/(protected)/pengaturan/akun/actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

export type AccountRow = {
  id: string;
  name: string;
  email: string;
  role: AdminRole;
  active: boolean;
  lastLoginAt: string | null;
  self: boolean;
};

/** A readable 12-character password without look-alike characters. */
function randomPassword() {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789";
  const bytes = crypto.getRandomValues(new Uint8Array(12));
  return Array.from(bytes, (byte) => alphabet[byte % alphabet.length]).join("");
}

function PasswordInput({
  value,
  onChange,
  id,
}: {
  value: string;
  onChange: (value: string) => void;
  id: string;
}) {
  return (
    <div className="mt-2 flex gap-2">
      <input
        id={id}
        name="password"
        className="control font-mono"
        value={value}
        autoComplete="new-password"
        onChange={(event) => onChange(event.target.value)}
      />
      <Button variant="secondary" onClick={() => onChange(randomPassword())}>
        Buat acak
      </Button>
    </div>
  );
}

export function AdminAccounts({ accounts }: { accounts: AccountRow[] }) {
  const router = useRouter();
  const [notice, setNotice] = useState<{ ok: boolean; message: string } | null>(null);
  const [pending, setPending] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [resetFor, setResetFor] = useState<AccountRow | null>(null);
  const [resetPassword, setResetPassword] = useState("");
  const [deactivate, setDeactivate] = useState<AccountRow | null>(null);

  async function run(task: () => Promise<{ ok: boolean; message: string }>) {
    setPending(true);
    try {
      const result = await task();
      setNotice(result);
      if (result.ok) router.refresh();
      return result.ok;
    } catch {
      setNotice({ ok: false, message: "Perubahan belum dapat disimpan. Silakan coba lagi." });
      return false;
    } finally {
      setPending(false);
    }
  }

  async function add(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const ok = await run(() => addAdminAccount(new FormData(form)));
    if (ok) {
      form.reset();
      setNewPassword("");
    }
  }

  return (
    <div className="mt-6 space-y-6">
      {notice && (
        <p
          role="status"
          className={cn(
            "rounded-control p-3 text-sm",
            notice.ok ? "bg-primary-soft" : "bg-danger-soft text-danger",
          )}
        >
          {notice.message}
        </p>
      )}

      <div className="admin-card overflow-x-auto p-0">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Nama</th>
              <th>Peran</th>
              <th>Status</th>
              <th>Terakhir masuk</th>
              <th>Tindakan</th>
            </tr>
          </thead>
          <tbody>
            {accounts.map((account) => (
              <tr key={account.id}>
                <td>
                  <span className="font-semibold">{account.name}</span>
                  {account.self && <span className="ml-2 text-xs text-muted">(Anda)</span>}
                  <br />
                  <span className="text-xs text-muted">{account.email}</span>
                </td>
                <td>
                  {account.self ? (
                    ADMIN_ROLE_LABELS[account.role]
                  ) : (
                    <select
                      aria-label={`Peran ${account.name}`}
                      className="control min-h-9 w-auto py-1.5"
                      value={account.role}
                      disabled={pending}
                      onChange={(event) =>
                        run(() => updateAdminAccount(account.id, { role: event.target.value }))
                      }
                    >
                      {ADMIN_ROLES.map((role) => (
                        <option key={role} value={role}>
                          {ADMIN_ROLE_LABELS[role]}
                        </option>
                      ))}
                    </select>
                  )}
                </td>
                <td>
                  <Badge tone={account.active ? "rel" : "neutral"}>
                    {account.active ? "Aktif" : "Nonaktif"}
                  </Badge>
                </td>
                <td className="tabular text-muted">
                  {account.lastLoginAt ? formatDateTime(account.lastLoginAt) : "Belum pernah"}
                </td>
                <td>
                  {!account.self && (
                    <div className="flex flex-wrap gap-1">
                      <Button
                        variant="ghost"
                        className="min-h-9 px-4"
                        disabled={pending}
                        onClick={() => {
                          setResetPassword(randomPassword());
                          setResetFor(account);
                        }}
                      >
                        <KeyRound aria-hidden="true" className="h-4 w-4" />
                        Reset password
                      </Button>
                      {account.active ? (
                        <Button
                          variant="ghost"
                          className="min-h-9 text-danger"
                          disabled={pending}
                          onClick={() => setDeactivate(account)}
                        >
                          Nonaktifkan
                        </Button>
                      ) : (
                        <Button
                          variant="ghost"
                          className="min-h-9"
                          disabled={pending}
                          onClick={() =>
                            run(() => updateAdminAccount(account.id, { active: true }))
                          }
                        >
                          Aktifkan
                        </Button>
                      )}
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <form method="post" onSubmit={add} className="admin-card space-y-4">
        <h2 className="flex items-center gap-2 text-h3">
          <UserPlus aria-hidden="true" className="h-5 w-5" />
          Tambah akun
        </h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block text-sm font-semibold">
            Nama
            <input name="name" required className="control mt-2 font-normal" autoComplete="off" />
          </label>
          <label className="block text-sm font-semibold">
            Email
            <input
              name="email"
              type="email"
              required
              className="control mt-2 font-normal"
              autoComplete="off"
            />
          </label>
        </div>
        <fieldset>
          <legend className="text-sm font-semibold">Peran</legend>
          <div className="mt-2 grid gap-2 sm:grid-cols-3">
            {ADMIN_ROLES.map((role) => (
              <label
                key={role}
                className="flex cursor-pointer gap-3 rounded-control border border-border-strong p-3 text-sm has-[:checked]:border-navy has-[:checked]:bg-sand"
              >
                <input
                  type="radio"
                  name="role"
                  value={role}
                  defaultChecked={role === "hr"}
                  className="mt-0.5 h-4 w-4 accent-navy"
                />
                <span>
                  <span className="block font-semibold">{ADMIN_ROLE_LABELS[role]}</span>
                  <span className="text-muted">{ADMIN_ROLE_DESCRIPTIONS[role]}</span>
                </span>
              </label>
            ))}
          </div>
        </fieldset>
        <label className="block text-sm font-semibold" htmlFor="new-account-password">
          Password sementara
        </label>
        <PasswordInput id="new-account-password" value={newPassword} onChange={setNewPassword} />
        <p className="text-xs text-muted">
          Minimal 8 karakter. Salin dan berikan langsung ke pemilik akun (misalnya lewat WhatsApp
          pribadi), lalu minta mereka menggantinya di menu Akun saya setelah masuk.
        </p>
        <Button type="submit" disabled={pending}>
          Buat akun
        </Button>
      </form>

      <Dialog
        open={resetFor !== null}
        onClose={() => setResetFor(null)}
        title={`Reset password ${resetFor?.name ?? ""}?`}
      >
        <label className="block text-sm font-semibold" htmlFor="reset-password">
          Password baru
        </label>
        <PasswordInput id="reset-password" value={resetPassword} onChange={setResetPassword} />
        <p className="mt-2 text-xs text-muted">
          Salin password ini sebelum menyimpan. Akun tersebut langsung keluar dari semua perangkat.
        </p>
        <div className="mt-5 flex justify-end gap-2">
          <Button variant="ghost" onClick={() => setResetFor(null)}>
            Batal
          </Button>
          <Button
            disabled={pending}
            onClick={async () => {
              if (!resetFor) return;
              const ok = await run(() => resetAdminPassword(resetFor.id, resetPassword));
              if (ok) setResetFor(null);
            }}
          >
            Simpan password
          </Button>
        </div>
      </Dialog>

      <Dialog
        open={deactivate !== null}
        onClose={() => setDeactivate(null)}
        title={`Nonaktifkan ${deactivate?.name ?? ""}?`}
      >
        <p className="text-sm leading-relaxed text-muted">
          Akun ini langsung keluar dari semua perangkat dan tidak dapat masuk lagi sampai diaktifkan
          kembali. Riwayat yang dibuatnya tetap tersimpan.
        </p>
        <div className="mt-5 flex justify-end gap-2">
          <Button variant="ghost" onClick={() => setDeactivate(null)}>
            Batal
          </Button>
          <Button
            variant="danger"
            disabled={pending}
            onClick={async () => {
              if (!deactivate) return;
              const ok = await run(() => updateAdminAccount(deactivate.id, { active: false }));
              if (ok) setDeactivate(null);
            }}
          >
            Nonaktifkan
          </Button>
        </div>
      </Dialog>
    </div>
  );
}
