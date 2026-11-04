import { NotFoundContent } from "@/components/public/not-found-content";
import { SiteFooter } from "@/components/public/site-footer";
import { SiteHeader } from "@/components/public/site-header";

export const metadata = { title: "Halaman tidak ditemukan" };

/** Unmatched URLs render outside the (public) layout, so the shell is added here. */
export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <div className="flex-1">
        <NotFoundContent />
      </div>
      <SiteFooter />
    </div>
  );
}
