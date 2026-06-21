import { notFound } from "next/navigation";
import { ShieldCheck, Star, Truck, WalletCards, type LucideIcon } from "lucide-react";
import { ProductCard } from "@/components/product-card";
import { ProductPurchasePanel } from "@/components/product-purchase-panel";
import { getProductBySlug, getPublishedProducts } from "@/lib/services/catalog";
import { formatMoney } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { ProductImage } from "@/components/product-image";
import type { Product, ProductVariant } from "@/data/catalog";

type Params = Promise<{ slug: string }>;
type ProductImageSource = string | null | undefined;
type ProductTrustItem = readonly [LucideIcon, string];

const isValidImageUrl = (item: ProductImageSource): item is string =>
  typeof item === "string" && item.trim().length > 0;

export async function generateMetadata({ params }: { params: Params }) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  return { title: product?.name ?? "Product", description: product?.shortDescription };
}

export default async function ProductPage({ params }: { params: Params }) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) notFound();
  const price = product.salePrice ?? product.regularPrice;
  const discount = product.salePrice ? Math.round(((product.regularPrice - product.salePrice) / product.regularPrice) * 100) : 0;
  const related = (await getPublishedProducts({ category: product.category })).filter((item: Product) => item.id !== product.id).slice(0, 4);
  const variantImageSources: ProductImageSource[] = product.variants.map((variant: ProductVariant) => variant.image);
  const rawProductImages: ProductImageSource[] = [...product.images, ...variantImageSources];
  const productImages: string[] = Array.from(new Set(rawProductImages.filter(isValidImageUrl)));
  const fallbackImage = productImages[0] ?? product.images.find(isValidImageUrl);
  const trustItems: ProductTrustItem[] = [
    [Truck, product.deliveryEstimate],
    [WalletCards, "COD, bKash, card"],
    [ShieldCheck, "Easy exchange policy"]
  ];

  return (
    <main className="container py-8">
      <nav className="mb-6 text-sm text-warmgrey">Home / {product.category} / <span className="text-ink">{product.name}</span></nav>
      <div className="grid gap-8 lg:grid-cols-[1fr_.85fr]">
        <section className="grid gap-4 sm:grid-cols-[90px_1fr]">
          <div className="hidden gap-3 sm:grid">
            {productImages.map((src: string, index: number) => (
              <div key={`${product.id}-thumbnail-${index}-${src}`} className="relative aspect-square overflow-hidden rounded-md border border-rosewood/10 bg-white">
                <ProductImage src={src} alt={`${product.name} thumbnail`} fill className="object-cover" />
              </div>
            ))}
          </div>
          <div className="relative aspect-[3/4] overflow-hidden rounded-md bg-white shadow-soft">
            <ProductImage src={fallbackImage} alt={product.name} fill className="object-cover transition duration-500 hover:scale-105" priority />
            {discount ? <Badge className="absolute left-4 top-4 bg-white">{discount}% Off</Badge> : null}
          </div>
        </section>
        <section>
          <div className="text-sm font-semibold text-rosewood">{product.category} / {product.collection}</div>
          <h1 className="mt-2 font-display text-4xl font-black leading-tight">{product.name}</h1>
          <p className="mt-3 flex items-center gap-2 text-sm text-ink/65"><Star className="h-4 w-4 fill-saffron text-saffron" /> {product.rating.toFixed(1)} from {product.reviewCount} reviews</p>
          <div className="mt-5 flex items-center gap-3">
            <span className="text-3xl font-black text-rosewood">{formatMoney(price)}</span>
            {product.salePrice ? <span className="text-lg text-ink/45 line-through">{formatMoney(product.regularPrice)}</span> : null}
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <Badge>SKU {product.sku}</Badge>
            <Badge>{product.stock > 0 ? `${product.stock} in stock` : "Out of stock"}</Badge>
            <Badge>{product.fabric}</Badge>
          </div>
          <p className="mt-5 leading-7 text-ink/75">{product.description}</p>
          <ProductPurchasePanel product={product} />
          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            {trustItems.map(([Icon, text]: ProductTrustItem) => (
              <div key={String(text)} className="rounded-md bg-white p-4 text-sm font-bold shadow-card">
                <Icon className="mb-2 h-5 w-5 text-rosewood" /> {String(text)}
              </div>
            ))}
          </div>
          <div className="mt-6 grid gap-4 rounded-md bg-white p-5 text-sm leading-7 text-ink/75 shadow-card">
            <h2 className="font-display text-2xl font-black text-ink">Product details</h2>
            <p><strong>Specifications:</strong> {product.fabric}, {product.occasion}, {product.stitching}</p>
            <p><strong>Care:</strong> {product.care}</p>
            <p><strong>Package:</strong> {product.packageContents}</p>
            <p><strong>Return policy:</strong> Eligible items can be exchanged within 7 days when unused and with original packaging.</p>
          </div>
        </section>
      </div>
      <section className="mt-14">
        <h2 className="font-display text-3xl font-black">Related products</h2>
        <div className="mt-6 grid grid-cols-2 gap-5 lg:grid-cols-4">
          {related.map((item: Product) => <ProductCard key={item.id} product={item} />)}
        </div>
      </section>
    </main>
  );
}
