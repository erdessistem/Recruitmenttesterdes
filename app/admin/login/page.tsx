import Image from "next/image";
import { LoginForm } from "@/components/admin/login-form";
import { BackLink } from "@/components/ui/back-link";
export const metadata = { title: "Masuk admin", robots: { index: false, follow: false } };
export default function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center px-6 py-12">
      <div className="w-full max-w-md">
        <BackLink href="/">Beranda karier</BackLink>
        <div className="mt-4 rounded-panel border border-border bg-surface p-8">
          <Image src="/logo.png" alt="PT. Erdes - Desa Maju Bersama" width={852} height={624} priority className="h-16 w-auto" />
          <h1 className="mt-6 text-3xl font-bold tracking-tight">Masuk admin</h1>
          <p className="mt-2 text-sm text-muted">Kelola proses rekrutmen Anda.</p>
          <LoginForm />
        </div>
      </div>
    </main>
  );
}
