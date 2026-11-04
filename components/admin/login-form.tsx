"use client";
import { useActionState } from "react";
import { login } from "@/app/admin/actions";
export function LoginForm() {
  const [message, action, pending] = useActionState(login, "");
  return (
    <form action={action} className="mt-7 space-y-5">
      <label className="block text-sm font-semibold">
        Email
        <input
          name="email"
          type="email"
          required
          autoComplete="username"
          className="control mt-2 font-normal"
        />
      </label>
      <label className="block text-sm font-semibold">
        Password
        <input
          name="password"
          type="password"
          required
          autoComplete="current-password"
          className="control mt-2 font-normal"
        />
      </label>
      {message && (
        <p role="alert" className="text-sm text-danger">
          {message}
        </p>
      )}
      <button
        disabled={pending}
        className="w-full rounded-control bg-primary px-4 py-3 font-semibold text-white disabled:opacity-50"
      >
        {pending ? "Memproses…" : "Masuk"}
      </button>
    </form>
  );
}
