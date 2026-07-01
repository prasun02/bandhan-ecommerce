import { requireAdmin } from "@/lib/auth";

export default async function AdminSettingsPage() {
  await requireAdmin();
  return (
    <main className="container py-8">
      <h1 className="text-3xl font-black">Site settings</h1>
      <form className="mt-6 grid max-w-2xl gap-4 rounded-md bg-white p-6 shadow-sm">
        {["Website name", "Logo URL", "Favicon URL", "Brand primary color", "Business phone", "Business email", "Return policy", "Privacy policy", "Payment instructions"].map((field) => (
          <label key={field} className="grid gap-2 text-sm font-semibold">
            {field}
            <input className="h-11 rounded-md border border-ink/15 px-3" />
          </label>
        ))}
        <button className="h-11 rounded-md bg-rosewood font-bold text-white">Save settings</button>
      </form>
    </main>
  );
}
