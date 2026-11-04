import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";
export function Table({ className, ...props }: ComponentProps<"table">) { return <div className="w-full overflow-x-auto"><table className={cn("w-full text-left text-sm", className)} {...props} /></div>; }
export function TableHead({ className, ...props }: ComponentProps<"th">) { return <th scope="col" className={cn("border-b border-border px-4 py-3 font-semibold", className)} {...props} />; }
export function TableCell({ className, ...props }: ComponentProps<"td">) { return <td className={cn("border-b border-border px-4 py-3", className)} {...props} />; }
