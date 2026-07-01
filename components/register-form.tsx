"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type FieldErrors = Record<string, string[] | undefined>;

export function RegisterForm() {
  const router = useRouter();
  const [errors, setErrors] = useState<FieldErrors>({});
  const [message, setMessage] = useState("");
  const [pending, setPending] = useState(false);

  async function submit(formData: FormData) {
    if (pending) return;
    setPending(true);
    setErrors({});
    setMessage("");
    const response = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: formData.get("name"),
        email: formData.get("email"),
        phone: formData.get("phone"),
        password: formData.get("password"),
        confirmPassword: formData.get("confirmPassword"),
        termsAccepted: formData.get("termsAccepted") === "on"
      })
    });
    const result = await response.json() as { error?: string; fields?: FieldErrors };
    setPending(false);
    if (!response.ok) {
      setMessage(result.error ?? "Account creation failed.");
      setErrors(result.fields ?? {});
      return;
    }
    router.push("/login?registered=1");
  }

  const field = (name: string) => errors[name]?.[0]
    ? <span className="text-xs font-semibold text-red-700">{errors[name]?.[0]}</span>
    : null;

  return (
    <form action={submit} className="mx-auto grid max-w-md gap-4 rounded-md bg-white p-6 shadow-sm">
      <h1 className="text-3xl font-black">Create account</h1>
      {message ? <p className="rounded-md bg-red-50 p-3 text-sm text-red-700">{message}</p> : null}
      <label className="grid gap-1 text-sm font-semibold">Full name
        <input name="name" autoComplete="name" required className="h-11 rounded-md border border-ink/15 px-3" />
        {field("name")}
      </label>
      <label className="grid gap-1 text-sm font-semibold">Email
        <input type="email" name="email" autoComplete="email" required className="h-11 rounded-md border border-ink/15 px-3" />
        {field("email")}
      </label>
      <label className="grid gap-1 text-sm font-semibold">Phone number
        <input name="phone" autoComplete="tel" placeholder="01XXXXXXXXX" required className="h-11 rounded-md border border-ink/15 px-3" />
        {field("phone")}
      </label>
      <label className="grid gap-1 text-sm font-semibold">Password
        <input type="password" name="password" autoComplete="new-password" required className="h-11 rounded-md border border-ink/15 px-3" />
        <span className="text-xs font-normal text-ink/60">8+ characters with uppercase, lowercase, number, and symbol.</span>
        {field("password")}
      </label>
      <label className="grid gap-1 text-sm font-semibold">Confirm password
        <input type="password" name="confirmPassword" autoComplete="new-password" required className="h-11 rounded-md border border-ink/15 px-3" />
        {field("confirmPassword")}
      </label>
      <label className="flex items-start gap-2 text-sm">
        <input type="checkbox" name="termsAccepted" required className="mt-1" />
        <span>I accept the terms and privacy policy.</span>
      </label>
      {field("termsAccepted")}
      <button disabled={pending} className="h-11 rounded-md bg-rosewood font-bold text-white disabled:opacity-60">
        {pending ? "Creating account..." : "Register"}
      </button>
    </form>
  );
}
