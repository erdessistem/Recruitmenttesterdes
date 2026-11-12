import { STAGES, STAGE_LABELS, type ApplicationStatus, type Stage } from "@/lib/constants";
import { formatDate } from "@/lib/format/date";
import { cn } from "@/lib/utils";

type HistoryPoint = { toStage: Stage; changedAt: string };

/** Date each reached station was last entered, so backward moves show the latest visit. */
function stationDates(history: HistoryPoint[], currentIndex: number) {
  const dates = new Map<Stage, string>();
  for (const event of history) {
    if (STAGES.indexOf(event.toStage) <= currentIndex) dates.set(event.toStage, event.changedAt);
  }
  return dates;
}

const CLOSED_LABEL: Partial<Record<ApplicationStatus, string>> = {
  rejected: "Tidak dilanjutkan",
  withdrawn: "Lamaran ditarik",
};

/**
 * The recruitment route: six stations, filled up to the current one.
 * Horizontal from `sm`, vertical on phones so labels never truncate.
 */
export function StageLine({
  currentStage,
  status,
  history = [],
  animate = false,
  className,
}: {
  currentStage: Stage;
  status: ApplicationStatus;
  history?: HistoryPoint[];
  animate?: boolean;
  className?: string;
}) {
  const currentIndex = STAGES.indexOf(currentStage);
  const dates = stationDates(history, currentIndex);
  const closed = status !== "active";
  const hired = currentStage === "hired" && !closed;
  // Fraction of the line between first and last station that is filled.
  const progress = currentIndex / (STAGES.length - 1);

  return (
    <ol
      className={cn(
        "relative grid gap-5 sm:grid-cols-6 sm:gap-0",
        status === "withdrawn" && "opacity-70",
        className,
      )}
      aria-label="Tahapan rekrutmen"
    >
      {/* Track (vertical on phones, horizontal from sm). Stations are centered in each 1/6 column. */}
      <li
        aria-hidden="true"
        className="absolute bottom-[30px] left-[10px] top-3 w-1 rounded-full bg-sand sm:inset-x-[8.333%] sm:bottom-auto sm:top-[10px] sm:h-1 sm:w-auto"
      >
        <div
          className={cn(
            "h-[calc(var(--p)*100%)] w-full rounded-full sm:h-full sm:w-[calc(var(--p)*100%)]",
            closed ? "bg-muted" : "bg-navy",
            animate && "jalur-fill-y sm:jalur-fill",
          )}
          style={{ ["--p" as string]: progress }}
        />
      </li>
      {STAGES.map((stage, index) => {
        const reached = index <= currentIndex;
        const current = index === currentIndex;
        const date = dates.get(stage);
        const closedHere = current && closed;
        return (
          <li
            key={stage}
            aria-current={current ? "step" : undefined}
            className="relative flex items-start gap-4 sm:flex-col sm:items-center sm:gap-2 sm:text-center"
          >
            <span className="flex h-6 w-6 shrink-0 items-center justify-center">
              <span
                aria-hidden="true"
                className={cn(
                  "relative z-10 block rounded-full border-2",
                  current && !closed && !hired ? "h-6 w-6 border-sinyal-ink bg-sinyal" : "h-4 w-4",
                  !current &&
                    reached &&
                    (closed ? "border-muted bg-muted" : "border-navy bg-navy"),
                  !reached && "border-border-strong bg-surface",
                  current && hired && "h-6 w-6 border-navy bg-navy",
                  closedHere &&
                    (status === "rejected"
                      ? "h-5 w-5 border-danger bg-surface"
                      : "h-5 w-5 border-muted bg-surface"),
                )}
              />
            </span>
            <span className="min-w-0 pt-0.5 sm:pt-0">
              <span
                className={cn(
                  "block text-sm leading-5",
                  current
                    ? "font-semibold text-foreground"
                    : reached
                      ? "text-foreground"
                      : "text-muted",
                )}
              >
                {STAGE_LABELS[stage]}
                <span className="sr-only">
                  {current ? ", tahap saat ini" : reached ? ", sudah dilewati" : ", belum dimulai"}
                </span>
              </span>
              <span
                className={cn(
                  "block text-xs leading-5",
                  closedHere && status === "rejected" ? "font-medium text-danger" : "text-muted",
                )}
              >
                {closedHere ? (
                  CLOSED_LABEL[status]
                ) : current && !hired ? (
                  <span aria-hidden="true">Tahap saat ini</span>
                ) : reached && date ? (
                  formatDate(date)
                ) : (
                  " "
                )}
              </span>
            </span>
          </li>
        );
      })}
    </ol>
  );
}

/** Compact six-segment version for tables. The text label sits beside it. */
export function StageMeter({
  currentStage,
  status,
}: {
  currentStage: Stage;
  status: ApplicationStatus;
}) {
  const currentIndex = STAGES.indexOf(currentStage);
  const closed = status !== "active";
  return (
    <span className="inline-flex items-center gap-[3px] align-middle" aria-hidden="true">
      {STAGES.map((stage, index) => (
        <span
          key={stage}
          className={cn(
            "h-1.5 w-3 rounded-full",
            index > currentIndex
              ? "bg-line"
              : index === currentIndex && !closed && currentStage !== "hired"
                ? "bg-sinyal"
                : closed
                  ? status === "rejected" && index === currentIndex
                    ? "bg-danger"
                    : "bg-muted"
                  : "bg-navy",
          )}
        />
      ))}
    </span>
  );
}

/** The route with no progress, to show candidates what happens after they apply. */
export function StageRoute({ className }: { className?: string }) {
  return (
    <ol className={cn("relative grid gap-4 sm:grid-cols-6 sm:gap-0", className)}>
      <li
        aria-hidden="true"
        className="absolute bottom-2 left-[6px] top-2 w-1 rounded-full bg-sand sm:inset-x-[8.333%] sm:bottom-auto sm:top-[6px] sm:h-1 sm:w-auto"
      />
      {STAGES.map((stage) => (
        <li
          key={stage}
          className="relative flex items-center gap-3 sm:flex-col sm:gap-2 sm:text-center"
        >
          <span
            aria-hidden="true"
            className="relative z-10 h-4 w-4 shrink-0 rounded-full border-2 border-navy bg-surface"
          />
          <span className="text-sm">{STAGE_LABELS[stage]}</span>
        </li>
      ))}
    </ol>
  );
}
