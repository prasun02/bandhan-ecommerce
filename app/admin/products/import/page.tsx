import { AdminProductImportForm } from "@/components/admin-product-import-form";
import { requireAdmin } from "@/lib/auth";

export default async function AdminProductImportPage() {
  await requireAdmin();

  return (
    <main className="container py-8">
      <h1 className="text-3xl font-black">Import products</h1>
      <AdminProductImportForm />
    </main>
  );
}

