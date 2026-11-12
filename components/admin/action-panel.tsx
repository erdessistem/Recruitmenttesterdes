"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronUp, Copy, MessageCircle } from "lucide-react";
import { STAGES, STAGE_LABELS, type ApplicationStatus, type Stage } from "@/lib/constants";
import { toWhatsAppUrl } from "@/lib/format/phone";
import { updateApplicant } from "@/app/admin/(protected)/pelamar/actions";
import { Button, buttonClass } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

type Notice = { ok: boolean; text: string; whatsappStage?: Stage };

/** The next stage in the route; at the end (Diterima), the one before it. */
function defaultTarget(stage: Stage): Stage {
  const index = STAGES.indexOf(stage);
  return STAGES[index + 1] ?? STAGES[index - 1] ?? stage;
}

/**
 * Everything HR does to one applicant. Sticky beside the profile on wide screens;
 * on phones it is a bar at the bottom that opens into a sheet.
 */
export function ActionPanel({
  id,
  name,
  stage,
  status,
  whatsapp,
  messages,
}: {
  id: string;
  name: string;
  stage: Stage;
  status: ApplicationStatus;
  whatsapp: string;
  /** The WhatsApp message for each stage, with the candidate's details filled in. */
  messages: Record<Stage, string>;
}) {
  const router = useRouter();
  const suggested = defaultTarget(stage);
  const [target, setTarget] = useState<Stage>(suggested);
  const [publicNote, setPublicNote] = useState("");
  const [note, setNote] = useState("");
  const [reason, setReason] = useState("");
  const [message, setMessage] = useState(messages[stage]);
  const [shownStage, setShownStage] = useState(stage);
  const [notice, setNotice] = useState<Notice | null>(null);
  const [pending, setPending] = useState(false);
  const [confirmMove, setConfirmMove] = useState(false);
  const [rejecting, setRejecting] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);

  // After a refresh brings a new stage, reset the defaults that depend on it.
  if (shownStage !== stage) {
    setShownStage(stage);
    setTarget(defaultTarget(stage));
    setMessage(messages[stage]);
  }

  const backward = STAGES.indexOf(target) < STAGES.indexOf(stage);
  const risky = backward || target === "hired" || stage === "hired";
  const whatsappUrl = toWhatsAppUrl(whatsapp, message);

  async function perform(action: "move" | "reject" | "reopen" | "note") {
    setPending(true);
    setNotice(null);
    try {
      const result = await updateApplicant(id, {
        action,
        stage: target,
        note: action === "move" ? publicNote : action === "reject" ? reason : note,
        confirmed: true,
      });
      const texts = {
        move: `Dipindahkan ke ${STAGE_LABELS[target]}.`,
        reject: "Lamaran ditolak. Alasan disimpan sebagai catatan internal.",
        reopen: "Lamaran dibuka kembali.",
        note: "Catatan disimpan.",
      };
      setNotice({
        ok: result.ok,
        text: result.ok ? texts[action] : result.message,
        whatsappStage: result.ok && action === "move" ? target : undefined,
      });
      if (result.ok) {
        if (action === "move") setPublicNote("");
        if (action === "reject") setReason("");
        if (action === "note") setNote("");
        setConfirmMove(false);
        setRejecting(false);
        router.refresh();
      }
    } catch {
      setNotice({ ok: false, text: "Perubahan belum dapat disimpan. Silakan coba lagi." });
    } finally {
      setPending(false);
    }
  }

  async function copy() {
    try {
      await navigator.clipboard.writeText(message);
      setNotice({ ok: true, text: "Pesan disalin." });
    } catch {
      setNotice({ ok: false, text: "Gagal menyalin. Pilih dan salin pesan secara manual." });
    }
  }

  const sentUrl = notice?.whatsappStage
    ? toWhatsAppUrl(whatsapp, messages[notice.whatsappStage])
    : null;

  return (
    <aside
      aria-label="Tindakan rekrutmen"
      className={cn(
        "no-print fixed inset-x-0 bottom-0 z-30 border-t border-border bg-surface",
        "pb-[env(safe-area-inset-bottom)] lg:sticky lg:top-6 lg:z-auto lg:rounded-panel lg:border lg:pb-0",
      )}
    >
      <button
        type="button"
        aria-expanded={sheetOpen}
        onClick={() => setSheetOpen((open) => !open)}
        className="flex min-h-14 w-full items-center justify-between gap-3 px-4 text-left font-semibold lg:hidden"
      >
        <span className="min-w-0 truncate">Tindakan · {STAGE_LABELS[stage]}</span>
        <ChevronUp
          aria-hidden="true"
          className={cn(
            "h-5 w-5 shrink-0 transition-transform duration-200 motion-reduce:transition-none",
            !sheetOpen && "rotate-180",
          )}
        />
      </button>
      <div
        className={cn(
          "max-h-[75vh] overflow-y-auto border-t border-border px-4 pb-5 pt-4 lg:block lg:max-h-[calc(100vh-3rem)] lg:border-0 lg:p-5",
          !sheetOpen && "hidden",
        )}
      >
        <h2 className="hidden text-h3 lg:block">Tindakan</h2>

        {notice && (
          <div
            role="status"
            className={cn(
              "rounded-control p-3 text-sm lg:mt-3",
              notice.ok ? "bg-primary-soft" : "bg-danger-soft text-danger",
            )}
          >
            <p>{notice.text}</p>
            {sentUrl && (
              <a
                href={sentUrl}
                target="_blank"
                rel="noopener noreferrer"
                className={buttonClass("primary", "mt-3 w-full")}
              >
                <MessageCircle aria-hidden="true" className="h-4 w-4" />
                Kirim WhatsApp ke {name.split(" ")[0] || "kandidat"}
              </a>
            )}
          </div>
        )}

        {status === "active" && (
          <section className="mt-4">
            <label className="block text-sm font-semibold" htmlFor="target-stage">
              Pindahkan ke tahap
            </label>
            <select
              id="target-stage"
              className="control mt-2"
              value={target}
              onChange={(event) => setTarget(event.target.value as Stage)}
            >
              {STAGES.filter((item) => item !== stage).map((item) => (
                <option key={item} value={item}>
                  {STAGE_LABELS[item]}
                  {item === suggested && stage !== "hired" ? " (berikutnya)" : ""}
                </option>
              ))}
            </select>
            <label className="mt-3 block text-sm font-semibold" htmlFor="public-note">
              Catatan untuk kandidat <span className="font-normal text-muted">(opsional)</span>
            </label>
            <textarea
              id="public-note"
              className="control mt-2 min-h-20"
              maxLength={1000}
              value={publicNote}
              onChange={(event) => setPublicNote(event.target.value)}
              aria-describedby="public-note-hint"
            />
            <p id="public-note-hint" className="mt-1 text-xs text-muted">
              Terlihat oleh kandidat di halaman lacak.
            </p>
            <Button
              className="mt-3 w-full"
              disabled={pending || target === stage}
              onClick={() => (risky ? setConfirmMove(true) : perform("move"))}
            >
              Pindahkan ke {STAGE_LABELS[target]}
            </Button>
          </section>
        )}

        {status === "rejected" && (
          <section className="mt-4">
            <p className="text-sm text-muted">
              Lamaran ini ditolak. Buka kembali untuk melanjutkan prosesnya.
            </p>
            <Button
              variant="secondary"
              className="mt-3 w-full"
              disabled={pending}
              onClick={() => perform("reopen")}
            >
              Buka kembali lamaran
            </Button>
          </section>
        )}

        {status === "withdrawn" && (
          <p className="mt-4 text-sm text-muted">
            Kandidat menarik lamaran ini, jadi tahapnya tidak dapat diubah.
          </p>
        )}

        <section className="mt-6 border-t border-border pt-5">
          <label className="block text-sm font-semibold" htmlFor="wa-message">
            Pesan WhatsApp
          </label>
          <textarea
            id="wa-message"
            className="control mt-2 min-h-36 text-sm"
            value={message}
            onChange={(event) => setMessage(event.target.value)}
          />
          <div className="mt-3 grid grid-cols-[1fr_auto] gap-2">
            {whatsappUrl ? (
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className={buttonClass("secondary")}
              >
                <MessageCircle aria-hidden="true" className="h-4 w-4" />
                Buka WhatsApp
              </a>
            ) : (
              <span className="self-center text-sm text-muted">Nomor WhatsApp tidak tersedia.</span>
            )}
            <Button variant="ghost" onClick={copy} aria-label="Salin pesan WhatsApp">
              <Copy aria-hidden="true" className="h-4 w-4" />
              Salin
            </Button>
          </div>
        </section>

        <section className="mt-6 border-t border-border pt-5">
          <label className="block text-sm font-semibold" htmlFor="internal-note">
            Catatan internal
          </label>
          <textarea
            id="internal-note"
            className="control mt-2 min-h-20"
            maxLength={2000}
            value={note}
            onChange={(event) => setNote(event.target.value)}
            aria-describedby="internal-note-hint"
          />
          <p id="internal-note-hint" className="mt-1 text-xs text-muted">
            Hanya terlihat oleh admin.
          </p>
          <Button
            variant="secondary"
            className="mt-3 w-full"
            disabled={pending || !note.trim()}
            onClick={() => perform("note")}
          >
            Simpan catatan
          </Button>
        </section>

        {status === "active" && (
          <section className="mt-6 border-t border-border pt-5">
            <Button
              variant="ghost"
              className="w-full text-danger"
              disabled={pending || stage === "hired"}
              onClick={() => setRejecting(true)}
            >
              Tolak lamaran
            </Button>
            {stage === "hired" && (
              <p className="mt-1 text-center text-xs text-muted">
                Pindahkan dari tahap Diterima sebelum menolak.
              </p>
            )}
          </section>
        )}
      </div>

      <Dialog
        open={confirmMove}
        onClose={() => setConfirmMove(false)}
        title={`Pindahkan ke ${STAGE_LABELS[target]}?`}
      >
        <p className="text-sm leading-relaxed text-muted">
          {stage === "hired"
            ? "Kandidat ini sudah diterima. Memindahkannya akan membatalkan status Diterima."
            : target === "hired"
              ? "Kandidat akan ditandai Diterima dan melihatnya di halaman lacak."
              : `Ini memindahkan kandidat mundur dari ${STAGE_LABELS[stage]}. Perubahan tercatat di riwayat.`}
        </p>
        <div className="mt-5 flex justify-end gap-2">
          <Button variant="ghost" onClick={() => setConfirmMove(false)}>
            Batal
          </Button>
          <Button disabled={pending} onClick={() => perform("move")}>
            Pindahkan
          </Button>
        </div>
      </Dialog>

      <Dialog open={rejecting} onClose={() => setRejecting(false)} title="Tolak lamaran ini?">
        <label className="block text-sm font-semibold" htmlFor="reject-reason">
          Alasan penolakan
        </label>
        <textarea
          id="reject-reason"
          className="control mt-2 min-h-24"
          maxLength={2000}
          value={reason}
          onChange={(event) => setReason(event.target.value)}
          aria-describedby="reject-reason-hint"
        />
        <p id="reject-reason-hint" className="mt-1 text-xs text-muted">
          Disimpan sebagai catatan internal. Kandidat hanya melihat status &quot;Tidak
          dilanjutkan&quot;.
        </p>
        <div className="mt-5 flex justify-end gap-2">
          <Button variant="ghost" onClick={() => setRejecting(false)}>
            Batal
          </Button>
          <Button
            variant="danger"
            disabled={pending || !reason.trim()}
            onClick={() => perform("reject")}
          >
            Tolak lamaran
          </Button>
        </div>
      </Dialog>
    </aside>
  );
}
