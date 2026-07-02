import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { inventoryState } from "@/lib/inventory-state";

export default async function AdminInventoryPage() {
  await requireAdmin();
  const products = await prisma.product.findMany({
    where: { deletedAt: null },
    orderBy: { stockQuantity: "asc" },
    take: 100,
    select: {
      id: true,
      name: true,
      sku: true,
      stockQuantity: true,
      lowStockLimit: true,
      status: true,
      variants: {
        orderBy: { sku: "asc" },
        select: {
          id: true,
          sku: true,
          size: true,
          color: true,
          stockQuantity: true
        }
      }
    }
  });
  return (
    <main className="container py-8">
      <h1 className="text-3xl font-black">Inventory</h1>
      <div className="mt-6 grid gap-3">
        {products.map((product) => {
          const warnings = product.variants
            .map((variant) => ({
              ...variant,
              state: inventoryState(variant.stockQuantity, product.lowStockLimit)
            }))
            .filter((variant) => variant.state !== "IN_STOCK");
          return (
            <article key={product.id} className="rounded-md bg-white p-4 shadow-sm">
              <div className="flex flex-wrap justify-between gap-3">
                <div>
                  <strong>{product.name}</strong>
                  <p className="text-xs text-ink/60">{product.sku}</p>
                </div>
                <span className={product.stockQuantity <= product.lowStockLimit ? "font-bold text-red-700" : ""}>
                  {product.stockQuantity} total in stock
                </span>
                <span>{product.status}</span>
              </div>
              {warnings.length ? (
                <div className="mt-3 grid gap-1 rounded-md bg-red-50 p-3 text-xs text-red-800">
                  <strong>Variant stock warnings</strong>
                  {warnings.map((variant) => (
                    <p key={variant.id}>
                      {variant.sku}
                      {variant.color ? ` · ${variant.color}` : ""}
                      {variant.size ? ` · ${variant.size}` : ""}
                      {` · ${variant.stockQuantity} in stock · ${
                        variant.state === "OUT_OF_STOCK" ? "Out of stock" : "Low stock"
                      }`}
                    </p>
                  ))}
                </div>
              ) : null}
            </article>
          );
        })}
      </div>
    </main>
  );
}
