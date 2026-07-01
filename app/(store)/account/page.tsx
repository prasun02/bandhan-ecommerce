import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getCartSummary } from "@/lib/services/cart";
import { formatMoney } from "@/lib/utils";
import { LogoutButton } from "@/components/logout-button";

const links = [
  ["Profile", "/account/profile"],
  ["Addresses", "/account/addresses"],
  ["Orders", "/account/orders"],
  ["Wishlist", "/account/wishlist"],
  ["Security", "/account/security"]
];

export default async function AccountPage() {
  const current = await requireUser();
  const [user, cart, activeCoupons] = await Promise.all([
    prisma.user.findUniqueOrThrow({
      where: { id: current.id },
      include: {
        addresses: { orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }], take: 4 },
        orders: {
          orderBy: { createdAt: "desc" },
          take: 5,
          include: { returnRequests: { select: { id: true } } }
        },
        wishlist: { include: { _count: { select: { items: true } } } }
      }
    }),
    getCartSummary({ userId: current.id }),
    prisma.coupon.count({
      where: {
        active: true,
        AND: [
          { OR: [{ startsAt: null }, { startsAt: { lte: new Date() } }] },
          { OR: [{ endsAt: null }, { endsAt: { gte: new Date() } }] }
        ]
      }
    })
  ]);
  const returnCount = user.orders.reduce((sum, order) => sum + order.returnRequests.length, 0);

  return (
    <main className="container py-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-black">Welcome, {user.name ?? "Customer"}</h1>
          <p className="mt-1 text-sm text-ink/60">Member since {user.createdAt.toLocaleDateString("en-BD")}</p>
        </div>
        <LogoutButton className="rounded-md border border-rosewood px-4 py-2 text-sm font-bold text-rosewood" />
      </div>
      <div className="mt-6 grid gap-6 lg:grid-cols-[240px_1fr]">
        <aside className="h-fit rounded-md bg-white p-3 shadow-sm">
          <Link href="/account" className="block rounded-md bg-mist px-3 py-2 font-semibold">Overview</Link>
          {links.map(([label, href]) => <Link key={href} href={href} className="block rounded-md px-3 py-2 font-semibold hover:bg-mist">{label}</Link>)}
        </aside>
        <div className="grid gap-6">
          <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {[
              ["Cart items", String(cart.totalQuantity)],
              ["Wishlist", String(user.wishlist?._count.items ?? 0)],
              ["Saved addresses", String(user.addresses.length)],
              ["Return requests", String(returnCount)]
            ].map(([label, value]) => (
              <div key={label} className="rounded-md bg-white p-5 shadow-sm">
                <p className="text-sm text-ink/60">{label}</p><p className="mt-2 text-2xl font-black">{value}</p>
              </div>
            ))}
          </section>
          <section className="rounded-md bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between"><h2 className="text-xl font-black">Profile</h2><Link href="/account/profile" className="text-sm font-bold text-rosewood">Edit profile</Link></div>
            <dl className="mt-4 grid gap-3 sm:grid-cols-2">
              <div><dt className="text-xs text-ink/55">Email</dt><dd className="font-semibold">{user.email}</dd></div>
              <div><dt className="text-xs text-ink/55">Phone</dt><dd className="font-semibold">{user.phone ?? "Not provided"}</dd></div>
            </dl>
          </section>
          <section className="rounded-md bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between"><h2 className="text-xl font-black">Recent orders</h2><Link href="/account/orders" className="text-sm font-bold text-rosewood">All orders</Link></div>
            {user.orders.length === 0 ? <p className="mt-4 text-ink/60">You have not placed an order yet.</p> : (
              <div className="mt-4 overflow-x-auto"><table className="w-full text-left text-sm"><thead><tr><th className="py-2">Order</th><th>Status</th><th>Total</th><th>Date</th></tr></thead><tbody>
                {user.orders.map((order) => <tr key={order.id} className="border-t border-ink/10"><td className="py-3 font-bold">{order.orderNumber}</td><td>{order.status.replaceAll("_", " ")}</td><td>{formatMoney(order.total)}</td><td>{order.createdAt.toLocaleDateString("en-BD")}</td></tr>)}
              </tbody></table></div>
            )}
          </section>
          <section className="grid gap-3 sm:grid-cols-3">
            <Link href="/account/addresses" className="rounded-md bg-white p-5 font-bold shadow-sm">{user.addresses.length} saved address{user.addresses.length === 1 ? "" : "es"}</Link>
            <div className="rounded-md bg-white p-5 font-bold shadow-sm">{activeCoupons} available coupon{activeCoupons === 1 ? "" : "s"}</div>
            <Link href="/account/security" className="rounded-md bg-white p-5 font-bold text-rosewood shadow-sm">Change password</Link>
          </section>
        </div>
      </div>
    </main>
  );
}
