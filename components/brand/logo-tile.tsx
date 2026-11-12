import { cn } from "@/lib/utils";

/**
 * The logo symbol on a white tile, cropped in CSS from the supplied lockup
 * (public/logo.png). The brand kit shows the symbol alone at navigation size and
 * never places the logo straight on cream, terracotta or navy.
 */
export function LogoTile({
  label = "PT. Erdes",
  className,
}: {
  /** Accessible name. Pass an empty string when the link around it is already named. */
  label?: string;
  className?: string;
}) {
  return (
    <span
      className={cn("logo-tile", className)}
      style={{ backgroundImage: 'url("/logo.png")' }}
      role={label ? "img" : undefined}
      aria-label={label || undefined}
      aria-hidden={label ? undefined : true}
    />
  );
}
