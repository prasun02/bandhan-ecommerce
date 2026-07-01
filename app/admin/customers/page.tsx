import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function AdminCustomersPage() {
  await requireAdmin();
  const customers = await prisma.user.findMany({ where: { role: "CUSTOMER", deletedAt: null }, orderBy: { createdAt: "desc" }, take: 100, select: { id: true, name: true, email: true, phone: true, isActive: true, createdAt: true, _count: { select: { orders: true } } } });
  return <main className="container py-8"><h1 className="text-3xl font-black">Customers</h1><div className="mt-6 overflow-x-auto rounded-md bg-white shadow-sm"><table className="w-full text-left text-sm"><thead><tr><th className="p-3">Customer</th><th>Email</th><th>Phone</th><th>Orders</th><th>Status</th><th>Joined</th></tr></thead><tbody>{customers.map((customer) => <tr key={customer.id} className="border-t border-ink/10"><td className="p-3 font-bold">{customer.name}</td><td>{customer.email}</td><td>{customer.phone}</td><td>{customer._count.orders}</td><td>{customer.isActive ? "Active" : "Disabled"}</td><td>{customer.createdAt.toLocaleDateString("en-BD")}</td></tr>)}</tbody></table></div></main>;
}
