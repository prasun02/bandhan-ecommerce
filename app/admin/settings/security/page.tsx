import { requireAdmin } from "@/lib/auth";
import { PasswordChangeForm } from "@/components/password-change-form";

export default async function AdminSecurityPage() {
  await requireAdmin();
  return <main className="container py-8"><h1 className="text-3xl font-black">Administrator security</h1><p className="mt-2 text-sm text-ink/60">Changing the password revokes every existing session and renews this browser session.</p><PasswordChangeForm /></main>;
}
