"use client";

import { signIn } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { safeCallback } from "@/lib/security";

export function LoginForm({ admin = false }: { admin?: boolean }) {
  const params = useSearchParams();
  const [message, setMessage] = useState("");
  const [pending, setPending] = useState(false);
  const registered = !admin && params.get("registered") === "1";

  async function submit(formData: FormData) {
    if (pending) return;
    setPending(true);
    setMessage("");
    const result = await signIn("credentials", {
      email: String(formData.get("email") ?? "").trim().toLowerCase(),
      password: String(formData.get("password") ?? ""),
      purpose: admin ? "admin" : "customer",
      redirect: false
    });
    if (!result?.ok) {
      setPending(false);
      setMessage(admin ? "Invalid administrator credentials." : "Invalid email or password.");
      return;
    }
    await fetch("/api/cart/merge", { method: "POST" }).catch(() => undefined);
    window.location.assign(admin ? "/admin" : safeCallback(params.get("callbackUrl")));
  }

  return (
    <form action={submit} className="mx-auto grid max-w-md gap-4 rounded-md bg-white p-6 shadow-sm">
      <h1 className="text-3xl font-black">{admin ? "Administrator login" : "Login"}</h1>
      {registered ? (
        <p className="rounded-md bg-green-50 p-3 text-sm font-semibold text-green-800">
          Your Bandhan account has been created successfully. Please log in.
        </p>
      ) : null}
      {message ? <p className="rounded-md bg-red-50 p-3 text-sm font-semibold text-red-700">{message}</p> : null}
      <input type="email" name="email" autoComplete="email" required placeholder="Email" className="h-11 rounded-md border border-ink/15 px-3" />
      <input type="password" name="password" autoComplete="current-password" required placeholder="Password" className="h-11 rounded-md border border-ink/15 px-3" />
      <button disabled={pending} className="h-11 rounded-md bg-rosewood font-bold text-white disabled:opacity-60">
        {pending ? "Signing in..." : "Login"}
      </button>
    </form>
  );
}
