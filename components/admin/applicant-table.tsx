"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  APPLICATION_STATUS_LABELS,
  STAGES,
  STAGE_LABELS,
  type ApplicationStatus,
  type Stage,
} from "@/lib/constants";
import { formatDate } from "@/lib/format/date";
import { bulkUpdateApplicants } from "@/app/admin/(protected)/pelamar/actions";
import { StageMeter } from "@/components/ui/stage-line";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

export type ApplicantTableRow = {
  id: string;
  name: string;
  vacancy: string;
  stage: Stage;
  status: ApplicationStatus;
  appliedAt: string;
  /** Days in the current stage, for active applicants only. */
  days: number | null;
  waiting: boolean;
  isNew: boolean;
};

type Result = {
  ok: boolean;
  message: string;
  skipped?: Array<{ id: string; name: string; reason: string }>;
};

/** The applicant list with checkboxes; selected rows can be moved or rejected together. */
export function ApplicantTable({ rows, query }: { rows: ApplicantTableRow[]; query: string }) {
  const router = useRouter();
  const [selected, setSelected] = useState<string[]>([]);
  const [stage, setStage] = useState<Stage | "">("");
  const [reason, setReason] = useState("");
  const [dialog, setDialog] = useState<"move" | "reject" | null>(null);
  const [pending, setPending] = useState(false);
  const [result, setResult] = useState<Result | null>(null);

  // Drop selections that are no longer on this page after a filter or page change.
  const visible = new Set(rows.map((row) => row.id));
  const chosen = selected.filter((id) => visible.has(id));
  const all = rows.length > 0 && chosen.length === rows.length;
  const chosenRows = rows.filter((row) => chosen.includes(row.id));
  const activeChosen = chosenRows.filter((row) => row.status === "active");

  function toggle(id: string) {
    setSelected((current) =>
      current.includes(id) ? current.filter((item) => item !== id) : [...current, id],
    );
  }

  async function run(action: "move" | "reject") {
    setPending(true);
    try {
      const response = await bulkUpdateApplicants(chosen, {
        action,
        stage: stage || undefined,
        note: action === "reject" ? reason : "",
      });
      setResult(response);
      if (response.ok) {
        setSelected([]);
        setReason("");
        setStage("");
        router.refresh();
      }
    } catch {
      setResult({ ok: false, message: "Perubahan belum dapat disimpan. Silakan coba lagi." });
    } finally {
      setPending(false);
      setDialog(null);
    }
  }

  return (
    <>
      {result && (
        <div
          role="status"
          className={cn(
            "mb-3 rounded-control p-3 text-sm",
            result.ok ? "bg-primary-soft" : "bg-danger-soft text-danger",
          )}
        >
          <div className="flex items-start justify-between gap-3">
            <p className="font-semibold">{result.message}</p>
            <button
              type="button"
              onClick={() => setResult(null)}
              className="text-xs font-semibold underline"
            >
              Tutup
            </button>
          </div>
          {result.skipped && result.skipped.length > 0 && (
            <ul className="mt-2 list-disc space-y-0.5 pl-5 text-foreground">
              {result.skipped.map((item) => (
                <li key={item.id}>
                  {item.name}: {item.reason}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      <div className="admin-card overflow-x-auto p-0">
        <table className="admin-table">
          <thead>
            <tr>
              <th className="w-12">
                <input
                  type="checkbox"
                  className="h-4 w-4 accent-[var(--color-primary)]"
                  aria-label="Pilih semua di halaman ini"
                  checked={all}
                  onChange={() => setSelected(all ? [] : rows.map((row) => row.id))}
                />
              </th>
              <th>Nama</th>
              <th>Lowongan</th>
              <th>Tahap</th>
              <th>Lama di tahap</th>
              <th>Status</th>
              <th>Melamar</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const checked = chosen.includes(row.id);
              return (
                <tr key={row.id} className={cn(checked && "bg-primary-soft/50")}>
                  <td>
                    <input
                      type="checkbox"
                      className="h-4 w-4 accent-[var(--color-primary)]"
                      aria-label={`Pilih ${row.name}`}
                      checked={checked}
                      onChange={() => toggle(row.id)}
                    />
                  </td>
                  <td>
                    <Link
                      className="font-semibold text-primary hover:underline"
                      href={`/admin/pelamar/${encodeURIComponent(row.id)}${query}`}
                    >
                      {row.name}
                    </Link>
                    {row.isNew && (
                      <Badge tone="sinyal" className="ml-2">
                        Baru
                      </Badge>
                    )}
                    <br />
                    <span className="tabular text-xs text-muted">{row.id}</span>
                  </td>
                  <td>{row.vacancy}</td>
                  <td>
                    <span className="inline-flex items-center gap-2 whitespace-nowrap">
                      <StageMeter currentStage={row.stage} status={row.status} />
                      {STAGE_LABELS[row.stage]}
                    </span>
                  </td>
                  <td className="tabular whitespace-nowrap">
                    {row.days == null ? (
                      <span className="text-muted">—</span>
                    ) : row.waiting ? (
                      <Badge tone="sinyal">{row.days} hari</Badge>
                    ) : (
                      <span className="text-muted">
                        {row.days === 0 ? "Hari ini" : `${row.days} hari`}
                      </span>
                    )}
                  </td>
                  <td>
                    <Badge
                      tone={
                        row.status === "active"
                          ? "rel"
                          : row.status === "rejected"
                            ? "danger"
                            : "neutral"
                      }
                    >
                      {APPLICATION_STATUS_LABELS[row.status]}
                    </Badge>
                  </td>
                  <td className="tabular whitespace-nowrap text-muted">
                    {formatDate(row.appliedAt)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {chosen.length > 0 && (
        <div
          role="region"
          aria-label="Tindakan untuk pelamar terpilih"
          className="sticky bottom-4 z-20 mt-4 flex flex-wrap items-center gap-3 rounded-panel bg-ink p-3 text-white shadow-xl"
        >
          <span className="px-2 text-sm font-semibold">{chosen.length} dipilih</span>
          <select
            aria-label="Tahap tujuan"
            className="control min-h-10 w-auto flex-1 font-normal text-foreground sm:flex-none"
            value={stage}
            onChange={(event) => setStage(event.target.value as Stage | "")}
          >
            <option value="">Pindahkan ke tahap…</option>
            {STAGES.map((s) => (
              <option key={s} value={s}>
                {STAGE_LABELS[s]}
              </option>
            ))}
          </select>
          <Button
            className="min-h-10"
            disabled={!stage || pending}
            onClick={() => setDialog("move")}
          >
            Pindahkan
          </Button>
          <Button
            variant="ghost"
            className="min-h-10 text-white hover:bg-white/10"
            disabled={pending}
            onClick={() => setDialog("reject")}
          >
            Tolak…
          </Button>
          <Button
            variant="ghost"
            className="ml-auto min-h-10 text-white/80 hover:bg-white/10"
            onClick={() => setSelected([])}
          >
            Batal
          </Button>
        </div>
      )}

      <Dialog
        open={dialog === "move"}
        onClose={() => setDialog(null)}
        title={
          stage ? `Pindahkan ${chosen.length} pelamar ke ${STAGE_LABELS[stage]}?` : "Pindahkan"
        }
      >
        <p className="text-sm leading-relaxed text-muted">
          Setiap perpindahan dicatat di riwayat pelamar dan terlihat di halaman lacak kandidat.
          {activeChosen.length < chosen.length &&
            ` ${chosen.length - activeChosen.length} pelamar yang tidak aktif akan dilewati.`}
        </p>
        <div className="mt-5 flex justify-end gap-2">
          <Button variant="ghost" onClick={() => setDialog(null)}>
            Batal
          </Button>
          <Button disabled={pending} onClick={() => run("move")}>
            {pending ? "Menyimpan…" : "Pindahkan"}
          </Button>
        </div>
      </Dialog>

      <Dialog
        open={dialog === "reject"}
        onClose={() => setDialog(null)}
        title={`Tolak ${chosen.length} pelamar?`}
      >
        <label className="block text-sm font-semibold" htmlFor="bulk-reason">
          Alasan penolakan
        </label>
        <textarea
          id="bulk-reason"
          className="control mt-2 min-h-24"
          maxLength={2000}
          value={reason}
          onChange={(event) => setReason(event.target.value)}
          aria-describedby="bulk-reason-hint"
        />
        <p id="bulk-reason-hint" className="mt-1 text-xs text-muted">
          Disimpan sebagai catatan internal di setiap pelamar. Pelamar yang tidak aktif atau sudah
          Diterima akan dilewati.
        </p>
        <div className="mt-5 flex justify-end gap-2">
          <Button variant="ghost" onClick={() => setDialog(null)}>
            Batal
          </Button>
          <Button
            variant="danger"
            disabled={pending || !reason.trim()}
            onClick={() => run("reject")}
          >
            {pending ? "Menyimpan…" : "Tolak pelamar"}
          </Button>
        </div>
      </Dialog>
    </>
  );
}
