import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function AdminInventoryPage() {
  await requireAdmin();
  const products = await prisma.product.findMany({ where: { deletedAt: null }, orderBy: { stockQuantity: "asc" }, take: 100, select: { id: true, name: true, sku: true, stockQuantity: true, lowStockLimit: true, status: true } });
  return <main className="container py-8"><h1 className="text-3xl font-black">Inventory</h1><div className="mt-6 grid gap-3">{products.map((product) => <article key={product.id} className="flex flex-wrap justify-between gap-3 rounded-md bg-white p-4 shadow-sm"><div><strong>{product.name}</strong><p className="text-xs text-ink/60">{product.sku}</p></div><span className={product.stockQuantity <= product.lowStockLimit ? "font-bold text-red-700" : ""}>{product.stockQuantity} in stock</span><span>{product.status}</span></article>)}</div></main>;
}
