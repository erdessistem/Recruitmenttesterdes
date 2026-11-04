import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

type Tone = "neutral" | "rel" | "sinyal" | "danger";

const tones: Record<Tone, string> = {
  neutral: "bg-paper text-muted ring-1 ring-inset ring-border",
  rel: "bg-primary-soft text-primary",
  sinyal: "bg-sinyal-soft text-sinyal-ink",
  danger: "bg-danger-soft text-danger",
};

export function Badge({ className, tone = "neutral", ...props }: ComponentProps<"span"> & { tone?: Tone }) {
  return (
    <span
      className={cn(
        "inline-flex items-center whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-semibold leading-5",
        tones[tone],
        className,
      )}
      {...props}
    />
  );
}
