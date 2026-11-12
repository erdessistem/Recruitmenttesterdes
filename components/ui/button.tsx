import Link from "next/link";
import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

/**
 * The brand kit's pill button. `primary` is terracotta and appears once per view;
 * `secondary` is the navy outline; `danger` is outlined so it never reads as primary.
 */
type Variant = "primary" | "secondary" | "ghost" | "danger";

const base =
  "inline-flex min-h-11 items-center justify-center gap-2 whitespace-nowrap rounded-full px-6 py-2 text-sm font-semibold transition-[background-color,transform] duration-150 ease-out active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-45 disabled:active:scale-100 motion-reduce:transition-none motion-reduce:active:scale-100";

const variants: Record<Variant, string> = {
  primary: "bg-primary text-primary-foreground hover:bg-primary-hover",
  secondary: "text-foreground ring-[1.5px] ring-inset ring-navy hover:bg-sand",
  ghost: "text-foreground hover:bg-sand",
  danger: "text-danger ring-[1.5px] ring-inset ring-danger hover:bg-danger-soft",
};

export function buttonClass(variant: Variant = "primary", className?: string) {
  return cn(base, variants[variant], className);
}

export function Button({
  className,
  type = "button",
  variant = "primary",
  ...props
}: ComponentProps<"button"> & { variant?: Variant }) {
  return <button type={type} className={buttonClass(variant, className)} {...props} />;
}

/** Same styles as Button, for navigation. */
export function ButtonLink({
  className,
  variant = "primary",
  ...props
}: ComponentProps<typeof Link> & { variant?: Variant }) {
  return <Link className={buttonClass(variant, className)} {...props} />;
}
