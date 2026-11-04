import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";
export function Badge({ className, ...props }: ComponentProps<"span">) { return <span className={cn("inline-flex rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700", className)} {...props} />; }
