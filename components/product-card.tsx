import Link from "next/link";
import { Heart, ShoppingBag, Star } from "lucide-react";
import type { Product } from "@/data/catalog";
import { formatMoney } from "@/lib/utils";
import { ProductImage } from "@/components/product-image";

export function ProductCard({ product }: { product: Product }) {
  const price = product.salePrice ?? product.regularPrice;
  const discount = product.salePrice ? Math.round(((product.regularPrice - product.salePrice) / product.regularPrice) * 100) : 0;
  const colors = [...new Set(product.variants.map((variant) => variant.color).filter(Boolean))].slice(0, 4);
  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-md bg-white shadow-card transition hover:-translate-y-1 hover:shadow-soft">
      <Link href={`/product/${product.slug}`} className="block">
        <div className="relative aspect-[3/4] overflow-hidden bg-blush">
          <ProductImage src={product.images[0]} alt={product.name} fill className="object-cover transition duration-500 group-hover:scale-105" sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw" />
          <div className="absolute left-3 top-3 flex flex-wrap gap-2">
            {product.newArrival ? <span className="rounded-full bg-white px-3 py-1 text-xs font-black text-rosewood shadow-sm">New</span> : null}
            {discount ? <span className="rounded-full bg-rosewood px-3 py-1 text-xs font-black text-white">{discount}% Off</span> : null}
          </div>
          <button aria-label="Add to wishlist" className="absolute right-3 top-3 grid h-9 w-9 place-items-center rounded-full bg-white text-rosewood shadow-sm">
            <Heart className="h-4 w-4" />
          </button>
        </div>
      </Link>
      <div className="flex flex-1 flex-col p-3 sm:p-4">
        <div className="text-xs font-bold uppercase tracking-wide text-warmgrey">{product.category}</div>
        <Link href={`/product/${product.slug}`} className="mt-1 line-clamp-2 min-h-11 font-bold leading-5 hover:text-rosewood">
          {product.name}
        </Link>
        <div className="mt-2 flex items-center gap-1 text-xs text-saffron">
          <Star className="h-3.5 w-3.5 fill-current" />
          <span className="font-bold text-ink">{product.rating.toFixed(1)}</span>
          <span className="text-warmgrey">({product.reviewCount})</span>
        </div>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <span className="font-black text-rosewood">{formatMoney(price)}</span>
          {product.salePrice ? <span className="text-sm text-ink/45 line-through">{formatMoney(product.regularPrice)}</span> : null}
        </div>
        <div className="mt-3 flex items-center gap-1">
          {colors.map((color) => <span key={color} title={color} className="h-4 w-4 rounded-full border border-ink/10 bg-rose" />)}
        </div>
        <div className="mt-auto grid gap-2 pt-4 sm:grid-cols-2">
          <Link href={`/product/${product.slug}`} className="inline-flex h-10 items-center justify-center rounded-md border border-saffron/40 text-xs font-bold text-rosewood hover:bg-blush">Quick View</Link>
          <Link href={`/product/${product.slug}`} className="inline-flex h-10 items-center justify-center rounded-md bg-rosewood text-xs font-bold text-white hover:bg-[#651832]">
            <ShoppingBag className="mr-1.5 h-3.5 w-3.5" /> Add
          </Link>
        </div>
      </div>
    </article>
  );
}
