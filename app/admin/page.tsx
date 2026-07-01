import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatMoney } from "@/lib/utils";

const delivered = ["DELIVERED", "RETURNED", "REFUNDED"] as const;

export default async function AdminDashboardPage() {
  await requireAdmin();
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const month = new Date(now.getFullYear(), now.getMonth(), 1);
  const sevenDays = new Date(now.getTime() - 7 * 86_400_000);
  const thirtyDays = new Date(now.getTime() - 30 * 86_400_000);
  const abandonedBefore = new Date(now.getTime() - 24 * 60 * 60_000);

  const [
    customers, newToday, newMonth, products, activeProducts, outOfStock, totalOrders,
    pendingOrders, processingOrders, deliveredOrders, cancelledOrders, gross, paid,
    codPending, activeCarts, abandonedCarts, recentOrders, recentCustomers,
    recentCarts, lowStock, recentAdminChanges, sales7, sales30, topSelling
  ] = await Promise.all([
    prisma.user.count({ where: { role: "CUSTOMER", deletedAt: null } }),
    prisma.user.count({ where: { role: "CUSTOMER", createdAt: { gte: today }, deletedAt: null } }),
    prisma.user.count({ where: { role: "CUSTOMER", createdAt: { gte: month }, deletedAt: null } }),
    prisma.product.count({ where: { deletedAt: null } }),
    prisma.product.count({ where: { status: "PUBLISHED", deletedAt: null } }),
    prisma.product.count({ where: { stockQuantity: { lte: 0 }, deletedAt: null } }),
    prisma.order.count(),
    prisma.order.count({ where: { status: { in: ["ORDER_PLACED", "AWAITING_PAYMENT", "PAYMENT_CONFIRMED"] } } }),
    prisma.order.count({ where: { status: { in: ["PROCESSING", "CONFIRMED", "PACKED", "READY_FOR_SHIPMENT", "SHIPPED", "OUT_FOR_DELIVERY"] } } }),
    prisma.order.count({ where: { status: "DELIVERED" } }),
    prisma.order.count({ where: { status: "CANCELLED" } }),
    prisma.order.aggregate({ _sum: { total: true }, where: { status: { notIn: ["CANCELLED", "FAILED_DELIVERY"] } } }),
    prisma.order.aggregate({ _sum: { total: true }, where: { paymentStatus: "PAID" } }),
    prisma.order.aggregate({ _sum: { total: true }, where: { paymentStatus: "COD_PENDING" } }),
    prisma.cart.count({ where: { items: { some: {} }, updatedAt: { gte: abandonedBefore } } }),
    prisma.cart.count({ where: { items: { some: {} }, updatedAt: { lt: abandonedBefore } } }),
    prisma.order.findMany({ orderBy: { createdAt: "desc" }, take: 6, select: { id: true, orderNumber: true, customerName: true, status: true, total: true, createdAt: true } }),
    prisma.user.findMany({ where: { role: "CUSTOMER" }, orderBy: { createdAt: "desc" }, take: 6, select: { id: true, name: true, email: true, createdAt: true } }),
    prisma.cart.findMany({ where: { items: { some: {} } }, orderBy: { updatedAt: "desc" }, take: 6, select: { id: true, userId: true, guestKey: true, updatedAt: true, _count: { select: { items: true } } } }),
    prisma.product.findMany({ where: { deletedAt: null, stockQuantity: { gt: 0, lte: 5 } }, orderBy: { stockQuantity: "asc" }, take: 8, select: { id: true, name: true, sku: true, stockQuantity: true } }),
    prisma.adminAuditLog.findMany({ orderBy: { createdAt: "desc" }, take: 6, include: { adminUser: { select: { name: true } } } }),
    prisma.order.aggregate({ _sum: { total: true }, where: { createdAt: { gte: sevenDays }, status: { in: [...delivered] } } }),
    prisma.order.aggregate({ _sum: { total: true }, where: { createdAt: { gte: thirtyDays }, status: { in: [...delivered] } } }),
    prisma.orderItem.groupBy({ by: ["productName"], _sum: { quantity: true }, orderBy: { _sum: { quantity: "desc" } }, take: 8 })
  ]);
  const grossSales = gross._sum.total ?? 0;
  const averageOrderValue = totalOrders ? Math.round(grossSales / totalOrders) : 0;
  const cards = [
    ["Total customers", customers], ["New today", newToday], ["New this month", newMonth],
    ["Total products", products], ["Active products", activeProducts], ["Out of stock", outOfStock],
    ["Low stock", lowStock.length], ["Total orders", totalOrders], ["Pending", pendingOrders],
    ["Processing", processingOrders], ["Delivered", deliveredOrders], ["Cancelled", cancelledOrders],
    ["Gross sales", formatMoney(grossSales)], ["Paid revenue", formatMoney(paid._sum.total ?? 0)],
    ["COD pending", formatMoney(codPending._sum.total ?? 0)], ["Average order", formatMoney(averageOrderValue)],
    ["Active carts", activeCarts], ["Abandoned carts", abandonedCarts]
  ];

  return (
    <main className="container py-8">
      <div className="flex flex-wrap items-center justify-between gap-3"><h1 className="text-3xl font-black">Admin dashboard</h1><nav className="flex gap-3 text-sm font-bold text-rosewood"><Link href="/admin/history">History</Link><Link href="/admin/settings/security">Security</Link></nav></div>
      <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">{cards.map(([label, value]) => <div key={label} className="rounded-md bg-white p-4 shadow-sm"><p className="text-xs text-ink/60">{label}</p><p className="mt-2 text-xl font-black">{value}</p></div>)}</div>
      <section className="mt-6 grid gap-4 md:grid-cols-2">
        <div className="rounded-md bg-white p-5 shadow-sm"><h2 className="font-black">Sales windows</h2><div className="mt-4 flex justify-between"><span>Last 7 days</span><strong>{formatMoney(sales7._sum.total ?? 0)}</strong></div><div className="mt-2 flex justify-between"><span>Last 30 days</span><strong>{formatMoney(sales30._sum.total ?? 0)}</strong></div></div>
        <div className="rounded-md bg-white p-5 shadow-sm"><h2 className="font-black">Order status breakdown</h2><p className="mt-4 text-sm">Pending {pendingOrders} · Processing {processingOrders} · Delivered {deliveredOrders} · Cancelled {cancelledOrders}</p></div>
      </section>
      <section className="mt-6 grid gap-4 xl:grid-cols-2">
        <DashboardList title="Recent orders" rows={recentOrders.map((o) => [o.orderNumber, `${o.customerName} · ${o.status.replaceAll("_", " ")} · ${formatMoney(o.total)}`])} />
        <DashboardList title="Recent customers" rows={recentCustomers.map((u) => [u.name ?? "Customer", `${u.email ?? "No email"} · ${u.createdAt.toLocaleDateString("en-BD")}`])} />
        <DashboardList title="Recent cart activity" rows={recentCarts.map((c) => [c.userId ? "Customer cart" : "Guest cart", `${c._count.items} line(s) · ${c.updatedAt.toLocaleString("en-BD")}`])} />
        <DashboardList title="Low-stock products" rows={lowStock.map((p) => [p.name, `${p.sku} · ${p.stockQuantity} left`])} />
        <DashboardList title="Top-selling products" rows={topSelling.map((p) => [p.productName, `${p._sum.quantity ?? 0} sold`])} />
        <DashboardList title="Recent administrative changes" rows={recentAdminChanges.map((a) => [a.action, `${a.description} · ${a.adminUser?.name ?? "Former admin"}`])} />
      </section>
      <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{["Orders", "Customers", "Products", "Inventory", "Carts", "History"].map((item) => <Link key={item} href={`/admin/${item.toLowerCase()}`} className="rounded-md bg-white p-5 font-bold shadow-sm hover:text-rosewood">{item}</Link>)}</div>
    </main>
  );
}

function DashboardList({ title, rows }: { title: string; rows: string[][] }) {
  return <div className="rounded-md bg-white p-5 shadow-sm"><h2 className="font-black">{title}</h2>{rows.length ? <div className="mt-3 grid gap-3">{rows.map(([name, detail], index) => <div key={`${name}-${index}`} className="border-t border-ink/10 pt-3 text-sm"><strong>{name}</strong><p className="text-ink/60">{detail}</p></div>)}</div> : <p className="mt-3 text-sm text-ink/60">No records yet.</p>}</div>;
}
