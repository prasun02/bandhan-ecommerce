import { AdminCategoryForm, AdminProductForm } from "@/components/admin-catalog-forms";
import { AdminProductEditForm } from "@/components/admin-product-edit-form";
import { prisma } from "@/lib/prisma";
import { formatMoney } from "@/lib/utils";
import { requireAdmin } from "@/lib/auth";
import { AdminDemoSeedButton } from "@/components/admin-demo-seed-button";

export default async function AdminProductsPage() {
  await requireAdmin();
  const [dbProducts, dbCategories] = await Promise.all([
    prisma.product.findMany({ orderBy: { createdAt: "desc" }, include: { category: true }, take: 60 }),
    prisma.category.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } })
  ]);

  return (
    <main className="container py-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-3xl font-black">Product management</h1>
        <div className="flex flex-wrap gap-2">
          <AdminDemoSeedButton />
          <a href="/admin/products/import" className="rounded-md bg-rosewood px-4 py-2 text-sm font-bold text-white">Import Products</a>
        </div>
      </div>
      <div className="mt-6 grid gap-5 lg:grid-cols-2">
        <AdminCategoryForm />
        <AdminProductForm categories={dbCategories} />
      </div>
      <AdminProductEditForm products={dbProducts.map((product) => ({ id: product.id, name: product.name }))} />
      <div className="mt-6 overflow-x-auto rounded-md bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="bg-mist"><tr><th className="p-3">Product</th><th>Category</th><th>SKU</th><th>Stock</th><th>Price</th><th>Status</th></tr></thead>
          <tbody>
            {dbProducts.map((product) => (
              <tr key={product.id} className="border-t border-ink/10">
                <td className="p-3 font-bold">{product.name}</td>
                <td>{product.category.name}</td>
                <td>{product.sku}</td>
                <td>{product.stockQuantity}</td>
                <td>{formatMoney(product.salePrice ?? product.regularPrice)}</td>
                <td>{product.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  );
}
