import { PageSkeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return <PageSkeleton className="mx-auto max-w-6xl px-4 py-10 sm:px-6" rows={4} />;
}
