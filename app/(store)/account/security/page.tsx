import { requireUser } from "@/lib/auth";
import { PasswordChangeForm } from "@/components/password-change-form";

export default async function SecurityPage() {
  await requireUser();
  return <main className="container py-8"><h1 className="text-3xl font-black">Account security</h1><p className="mt-2 text-sm text-ink/60">Changing your password revokes other sessions and renews this browser session.</p><PasswordChangeForm endpoint="/api/account/security/password" purpose="customer" successPath="/account/security?changed=1" /></main>;
}
