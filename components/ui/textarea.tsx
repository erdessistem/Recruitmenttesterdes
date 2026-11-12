import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";
export function Textarea({ className, ...props }: ComponentProps<"textarea">) {
  return (
    <textarea
      className={cn(
        "min-h-28 w-full rounded-control border border-border-strong bg-surface px-3 py-2 text-foreground hover:border-navy disabled:cursor-not-allowed disabled:bg-cream disabled:opacity-60",
        className,
      )}
      {...props}
    />
  );
}
