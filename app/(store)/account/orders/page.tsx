import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatMoney } from "@/lib/utils";

export default async function OrdersPage() {
  const user = await requireUser();
  const orders = await prisma.order.findMany({ where: { userId: user.id }, orderBy: { createdAt: "desc" } });
  return <main className="container py-8"><h1 className="text-3xl font-black">Your orders</h1><div className="mt-6 grid gap-3">{orders.length ? orders.map((order) => <article key={order.id} className="flex flex-wrap justify-between gap-3 rounded-md bg-white p-5 shadow-sm"><strong>{order.orderNumber}</strong><span>{order.status.replaceAll("_", " ")}</span><span>{formatMoney(order.total)}</span></article>) : <p className="rounded-md bg-white p-6">No orders yet.</p>}</div></main>;
}
