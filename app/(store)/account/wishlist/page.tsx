import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function WishlistPage() {
  const user = await requireUser();
  const wishlist = await prisma.wishlist.findUnique({ where: { userId: user.id }, include: { items: { include: { product: true } } } });
  return <main className="container py-8"><h1 className="text-3xl font-black">Wishlist</h1><div className="mt-6 grid gap-3">{wishlist?.items.length ? wishlist.items.map((item) => <a key={item.id} href={`/product/${item.product.slug}`} className="rounded-md bg-white p-5 font-bold shadow-sm">{item.product.name}</a>) : <p className="rounded-md bg-white p-6">Your wishlist is empty.</p>}</div></main>;
}
