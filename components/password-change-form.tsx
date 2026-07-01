"use client";

import { signIn, signOut } from "next-auth/react";
import { useState } from "react";

export function PasswordChangeForm({
  endpoint = "/api/admin/security/password",
  purpose = "admin",
  successPath = "/admin/settings/security?changed=1"
}: {
  endpoint?: string;
  purpose?: "admin" | "customer";
  successPath?: string;
}) {
  const [message, setMessage] = useState("");
  const [pending, setPending] = useState(false);
  async function submit(formData: FormData) {
    setPending(true);
    setMessage("");
    const currentPassword = String(formData.get("currentPassword") ?? "");
    const newPassword = String(formData.get("newPassword") ?? "");
    const response = await fetch(endpoint, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ currentPassword, newPassword, confirmPassword: formData.get("confirmPassword") }) });
    const result = await response.json() as { error?: string; email?: string };
    if (!response.ok) {
      setPending(false);
      setMessage(result.error ?? "Password change failed.");
      return;
    }
    await signOut({ redirect: false });
    const renewed = await signIn("credentials", { email: result.email, password: newPassword, purpose, redirect: false });
    window.location.assign(renewed?.ok ? successPath : purpose === "admin" ? "/admin/login?changed=1" : "/login?changed=1");
  }
  return <form action={submit} className="mt-6 grid max-w-lg gap-4 rounded-md bg-white p-6 shadow-sm">{message ? <p className="rounded bg-red-50 p-3 text-sm text-red-700">{message}</p> : null}<input name="currentPassword" type="password" autoComplete="current-password" required placeholder="Current password" className="h-11 rounded border px-3" /><input name="newPassword" type="password" autoComplete="new-password" required placeholder="New password" className="h-11 rounded border px-3" /><input name="confirmPassword" type="password" autoComplete="new-password" required placeholder="Confirm new password" className="h-11 rounded border px-3" /><p className="text-xs text-ink/60">Use 8+ characters with uppercase, lowercase, number, and symbol.</p><button disabled={pending} className="h-11 rounded bg-rosewood font-bold text-white disabled:opacity-60">{pending ? "Changing password…" : "Change password"}</button></form>;
}
