import { PageSkeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return <PageSkeleton className="mx-auto max-w-7xl" rows={6} />;
}
