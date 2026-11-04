"use client";
import { useActionState } from "react";
import { login } from "@/app/admin/actions";
import { buttonClass } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
export function LoginForm() {
  const [message, action, pending] = useActionState(login, "");
  return (
    <form action={action} className="mt-7 space-y-5">
      <Field label="Email">
        <input name="email" type="email" required autoComplete="username" className="control" />
      </Field>
      <Field label="Password">
        <input
          name="password"
          type="password"
          required
          autoComplete="current-password"
          className="control"
        />
      </Field>
      {message && (
        <p role="alert" className="text-sm text-danger">
          {message}
        </p>
      )}
      <button disabled={pending} className={buttonClass("primary", "w-full")}>
        {pending ? "Memproses…" : "Masuk"}
      </button>
    </form>
  );
}
