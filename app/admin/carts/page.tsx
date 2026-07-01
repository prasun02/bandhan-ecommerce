import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function AdminCartsPage() {
  await requireAdmin();
  const carts = await prisma.cart.findMany({ where: { items: { some: {} } }, orderBy: { updatedAt: "desc" }, take: 100, include: { user: { select: { name: true, email: true } }, items: { select: { quantity: true } } } });
  return <main className="container py-8"><h1 className="text-3xl font-black">Active and abandoned carts</h1><div className="mt-6 grid gap-3">{carts.length ? carts.map((cart) => <article key={cart.id} className="flex flex-wrap justify-between gap-3 rounded-md bg-white p-4 shadow-sm"><strong>{cart.user?.name ?? "Guest cart"}</strong><span>{cart.user?.email ?? "Anonymous visitor"}</span><span>{cart.items.reduce((sum, item) => sum + item.quantity, 0)} item(s)</span><span>{cart.updatedAt.toLocaleString("en-BD")}</span></article>) : <p className="rounded-md bg-white p-6">No carts with items.</p>}</div></main>;
}
