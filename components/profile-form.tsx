"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function ProfileForm({ name, email, phone }: { name: string; email: string; phone: string }) {
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [pending, setPending] = useState(false);
  async function submit(formData: FormData) {
    setPending(true);
    setMessage("");
    const response = await fetch("/api/account/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: formData.get("name"), phone: formData.get("phone") })
    });
    const result = await response.json() as { error?: string };
    setPending(false);
    setMessage(response.ok ? "Profile updated." : result.error ?? "Profile update failed.");
    if (response.ok) router.refresh();
  }
  return <form action={submit} className="mt-6 grid max-w-lg gap-4 rounded-md bg-white p-6 shadow-sm">{message ? <p className="rounded-md bg-mist p-3 text-sm font-semibold">{message}</p> : null}<label className="grid gap-1 text-sm font-semibold">Full name<input name="name" defaultValue={name} required className="h-11 rounded border px-3" /></label><label className="grid gap-1 text-sm font-semibold">Email<input value={email} disabled className="h-11 rounded border bg-mist px-3" /></label><label className="grid gap-1 text-sm font-semibold">Phone<input name="phone" defaultValue={phone} required className="h-11 rounded border px-3" /></label><button disabled={pending} className="h-11 rounded bg-rosewood font-bold text-white disabled:opacity-60">{pending ? "Saving…" : "Save profile"}</button></form>;
}
