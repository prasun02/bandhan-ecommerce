import Link from "next/link";
import { Suspense } from "react";
import { LoginForm } from "@/components/login-form";

export default function LoginPage() {
  return (
    <main className="container py-10">
      <Suspense fallback={<div className="mx-auto max-w-md rounded-md bg-white p-6">Loading…</div>}>
        <LoginForm />
      </Suspense>
      <div className="mx-auto mt-4 flex max-w-md justify-between text-sm font-semibold text-rosewood">
        <Link href="/forgot-password" className="text-sm font-semibold text-rosewood">Forgot password?</Link>
        <Link href="/register">Create account</Link>
      </div>
    </main>
  );
}
