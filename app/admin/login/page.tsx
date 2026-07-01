import { Suspense } from "react";
import { LoginForm } from "@/components/login-form";

export default function AdminLoginPage() {
  return <main className="container py-12"><Suspense fallback={<div>Loading…</div>}><LoginForm admin /></Suspense></main>;
}
