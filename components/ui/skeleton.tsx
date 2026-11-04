import { cn } from "@/lib/utils";

export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        "animate-pulse rounded-control bg-border/60 motion-reduce:animate-none",
        className,
      )}
    />
  );
}

/** Generic page placeholder: a title and a panel of rows. */
export function PageSkeleton({ rows = 5, className }: { rows?: number; className?: string }) {
  return (
    <div className={className} role="status" aria-live="polite">
      <span className="sr-only">Memuat…</span>
      <Skeleton className="h-9 w-56" />
      <div className="mt-6 divide-y divide-border rounded-panel border border-border bg-surface">
        {Array.from({ length: rows }, (_, index) => (
          <div key={index} className="flex items-center gap-4 px-6 py-5">
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-2/5" />
              <Skeleton className="h-3 w-3/5" />
            </div>
            <Skeleton className="h-6 w-20 rounded-full" />
          </div>
        ))}
      </div>
    </div>
  );
}
