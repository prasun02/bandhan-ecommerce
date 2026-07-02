"use client";

import { signOut } from "next-auth/react";
import { useState } from "react";

export function LogoutButton({
  callbackUrl = "/",
  className = ""
}: {
  callbackUrl?: string;
  className?: string;
}) {
  const [pending, setPending] = useState(false);

  async function logout() {
    if (pending) return;
    setPending(true);

    try {
      // Wait for NextAuth's expired Set-Cookie response before loading an
      // anonymous server-rendered layout.
      await signOut({ callbackUrl, redirect: false });
      window.location.replace(callbackUrl);
    } catch {
      setPending(false);
    }
  }

  return (
    <button
      type="button"
      className={className}
      disabled={pending}
      onClick={logout}
    >
      {pending ? "Signing out..." : "Logout"}
    </button>
  );
}
