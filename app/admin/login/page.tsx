import { LoginForm } from "@/components/admin/login-form";
export const metadata = { title: "Masuk admin", robots: { index: false, follow: false } };
export default function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center px-6 py-12">
      <div className="w-full max-w-md rounded-xl border border-border bg-white p-8 shadow-sm">
        <p className="text-sm font-bold uppercase tracking-widest text-primary">Erdes Group</p>
        <h1 className="mt-4 text-3xl font-bold">Masuk admin</h1>
        <p className="mt-2 text-sm text-muted">Kelola proses rekrutmen Anda.</p>
        <LoginForm />
      </div>
    </main>
  );
}
