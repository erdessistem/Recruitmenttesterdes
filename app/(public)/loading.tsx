import { Mascot } from "@/components/brand/mascot";
import { PageSkeleton } from "@/components/ui/skeleton";

/** Kio thinks while a public page loads; the skeleton holds the page's shape. */
export default function Loading() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <div className="mb-8 flex items-center gap-4">
        <Mascot animation="think" size={96} label="" loop />
        <p className="text-muted">Memuat halaman…</p>
      </div>
      <PageSkeleton rows={4} />
    </div>
  );
}
