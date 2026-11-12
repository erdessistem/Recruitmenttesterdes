import type { ReactNode } from "react";
import { Mascot, type MascotAnimation } from "@/components/brand/mascot";
import { cn } from "@/lib/utils";

/**
 * A short invitation to act, not an apology. Pass `kio` only where no other Kio
 * is on the screen (the brand allows one per screen).
 */
export function EmptyState({
  title,
  children,
  action,
  kio,
  className,
}: {
  title: string;
  children?: ReactNode;
  action?: ReactNode;
  kio?: MascotAnimation;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center rounded-panel bg-sand/60 px-6 py-10 text-center",
        className,
      )}
    >
      {kio && <Mascot animation={kio} size={112} label="" className="mb-4" />}
      <p className="font-display text-h3">{title}</p>
      {children && <p className="mx-auto mt-2 max-w-md text-sm text-muted">{children}</p>}
      {action && <div className="mt-5 flex justify-center">{action}</div>}
    </div>
  );
}
