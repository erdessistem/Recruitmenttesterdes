import { ShieldCheck } from "lucide-react";
import { formatWhatsAppDisplay } from "@/lib/format/phone";
import { cn } from "@/lib/utils";

/** Anti-fraud notice. The number comes from the admin-editable company profile. */
export function ScamNotice({ whatsapp, className }: { whatsapp?: string; className?: string }) {
  const number = whatsapp ? formatWhatsAppDisplay(whatsapp) : "";
  return (
    <aside
      aria-label="Waspada penipuan"
      className={cn("flex gap-3 rounded-panel bg-sand p-4 text-sm leading-6", className)}
    >
      <ShieldCheck aria-hidden="true" className="mt-0.5 h-5 w-5 shrink-0 text-navy" />
      <p>
        <span className="font-semibold">Rekrutmen Erdes Group tidak dipungut biaya.</span> Kami
        tidak pernah meminta transfer uang
        {number ? (
          <>
            {" "}
            dan hanya menghubungi Anda dari WhatsApp resmi{" "}
            <span className="tabular font-semibold">{number}</span>.
          </>
        ) : (
          "."
        )}
      </p>
    </aside>
  );
}
