import { cn } from "@/lib/utils";
import type { ComponentProps } from "react";

export function Button({
  className,
  type = "button",
  variant = "primary",
  ...props
}: ComponentProps<"button"> & { variant?: "primary" | "secondary" | "danger" }) {
  return (
    <button
      type={type}
      className={cn(
        "inline-flex min-h-11 items-center justify-center rounded-control px-4 py-2 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-50",
        variant === "primary"
          ? "bg-primary text-primary-foreground"
          : variant === "danger"
            ? "bg-danger text-white"
            : "border border-border bg-surface text-foreground",
        className,
      )}
      {...props}
    />
  );
}
