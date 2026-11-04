import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";
export function Textarea({ className, ...props }: ComponentProps<"textarea">) { return <textarea className={cn("min-h-28 w-full rounded-control border border-border bg-surface px-3 py-2 text-foreground disabled:opacity-50", className)} {...props} />; }
