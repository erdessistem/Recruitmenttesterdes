import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

type Tone = "neutral" | "rel" | "sinyal" | "danger";

/** Kit tags: navy text on sand or marigold. Terracotta is never text on sand. */
const tones: Record<Tone, string> = {
  neutral: "bg-cream text-muted ring-1 ring-inset ring-line",
  rel: "bg-sand text-navy",
  sinyal: "bg-marigold text-navy",
  danger: "bg-danger-soft text-danger",
};

export function Badge({
  className,
  tone = "neutral",
  ...props
}: ComponentProps<"span"> & { tone?: Tone }) {
  return (
    <span
      className={cn(
        "inline-flex items-center whitespace-nowrap rounded-control px-2.5 py-0.5 text-xs font-semibold leading-5",
        tones[tone],
        className,
      )}
      {...props}
    />
  );
}
