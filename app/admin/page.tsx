import Link from "next/link";
import { products } from "@/data/catalog";
import { formatMoney } from "@/lib/utils";

export default function AdminDashboardPage() {
  const cards = [
    ["Today's sales", formatMoney(1285000)],
    ["This month's sales", formatMoney(8420000)],
    ["Total orders", "126"],
    ["Pending orders", "14"],
    ["Total customers", "412"],
    ["Low stock products", String(products.filter((product) => product.stock < 12).length)]
  ];
  return (
    <main className="container py-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-black">Admin dashboard</h1>
        <Link href="/admin/settings" className="font-bold text-rosewood">Settings</Link>
      </div>
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map(([label, value]) => (
          <div key={label} className="rounded-md bg-white p-5 shadow-sm">
            <p className="text-sm text-ink/60">{label}</p>
            <p className="mt-2 text-2xl font-black">{value}</p>
          </div>
        ))}
      </div>
      <div className="mt-8 grid gap-4 md:grid-cols-3">
        {["Products", "Orders", "Customers", "Coupons", "Delivery zones", "Homepage sections", "Menus", "Reports", "Staff"].map((item) => (
          <Link key={item} href={`/admin/${item.toLowerCase().replaceAll(" ", "-")}`} className="rounded-md bg-white p-5 font-bold shadow-sm hover:text-rosewood">{item}</Link>
        ))}
      </div>
    </main>
  );
}
