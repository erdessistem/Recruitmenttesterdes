import { LoginForm } from "@/components/admin/login-form";
export const metadata = { title: "Masuk admin", robots: { index: false, follow: false } };
export default function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center px-6 py-12">
      <div className="w-full max-w-md rounded-panel border border-border bg-surface p-8">
        <p className="flex items-center gap-2.5 font-bold tracking-tight">
          <span aria-hidden="true" className="flex items-center gap-[3px]">
            <span className="h-2.5 w-2.5 rounded-full bg-primary" />
            <span className="h-1 w-3 rounded-full bg-primary" />
            <span className="h-2.5 w-2.5 rounded-full border-2 border-primary" />
          </span>
          Erdes Group
        </p>
        <h1 className="mt-6 text-3xl font-bold tracking-tight">Masuk admin</h1>
        <p className="mt-2 text-sm text-muted">Kelola proses rekrutmen Anda.</p>
        <LoginForm />
      </div>
    </main>
  );
}
