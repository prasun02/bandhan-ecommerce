import Link from "next/link";
import { BadgeCheck, Headphones, ShieldCheck, Sparkles, Truck, WalletCards } from "lucide-react";
import { HeroSlider } from "@/components/hero-slider";
import { ProductCard } from "@/components/product-card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { categories, categoryImages, type Product } from "@/data/catalog";
import { ProductImage } from "@/components/product-image";
import { getPublishedProducts } from "@/lib/services/catalog";

const sectionTitle = (eyebrow: string, title: string) => (
  <div className="mx-auto max-w-2xl text-center">
    <p className="text-xs font-black uppercase tracking-[.26em] text-saffron">{eyebrow}</p>
    <h2 className="mt-2 font-display text-3xl font-black text-ink md:text-5xl">{title}</h2>
  </div>
);

export default async function HomePage() {
  const products = await getPublishedProducts();
  const newArrivals = products.filter((product) => product.newArrival).slice(0, 8);
  const bestSellers = products.filter((product) => product.bestSeller).slice(0, 8);
  const bridal = products.filter((product) => product.collection === "Bridal Collection").slice(0, 4);
  const sarees = products.filter((product) => product.category === "Sarees").slice(0, 4);
  const salwar = products.filter((product) => product.category === "Salwar Kameez").slice(0, 4);

  return (
    <main>
      <HeroSlider />

      <section className="border-y border-rosewood/10 bg-white">
        <div className="container grid gap-3 py-5 sm:grid-cols-2 lg:grid-cols-5">
          {[
            [Truck, "Nationwide delivery"],
            [WalletCards, "Cash on Delivery"],
            [ShieldCheck, "Secure payment"],
            [BadgeCheck, "Easy exchange"],
            [Headphones, "Customer support"]
          ].map(([Icon, title]) => (
            <div key={String(title)} className="flex items-center gap-3 rounded-md bg-ivory p-3 text-sm font-bold">
              <Icon className="h-5 w-5 text-rosewood" />
              {String(title)}
            </div>
          ))}
        </div>
      </section>

      <section className="container py-14">
        {sectionTitle("Shop by style", "Featured categories")}
        <div className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-4">
          {categories.map((category) => {
            const count = products.filter((product) => product.category === category).length;
            return (
              <Link key={category} href={`/shop?category=${encodeURIComponent(category)}`} className="group overflow-hidden rounded-md bg-white shadow-card">
                <div className="relative aspect-[4/5] overflow-hidden bg-blush">
                  <ProductImage src={categoryImages[category]} alt={category} fill className="object-cover transition group-hover:scale-105" />
                </div>
                <div className="p-4">
                  <h3 className="font-display text-xl font-black text-ink">{category}</h3>
                  <p className="mt-1 text-sm text-warmgrey">{count} items available</p>
                  <p className="mt-3 text-sm font-bold text-rosewood">Shop Now</p>
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      <section className="bg-blush py-14">
        <div className="container">
          {sectionTitle("Freshly arrived", "New arrivals")}
          <div className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
            {newArrivals.map((product) => <ProductCard key={product.id} product={product} />)}
          </div>
        </div>
      </section>

      <section className="container py-14">
        <div className="relative overflow-hidden rounded-md bg-rosewood p-8 text-white shadow-soft md:p-12">
          <ProductImage src="/images/banners/promo-week.svg" alt="Deal of the Week" fill className="object-cover opacity-25" />
          <div className="relative z-10 max-w-xl">
            <Badge className="bg-white/90">Deal of the week</Badge>
            <h2 className="mt-4 font-display text-4xl font-black md:text-5xl">Upcoming Puja Offer</h2>
            <p className="mt-4 text-white/80">Save up to 25% on selected festive sarees, salwar kameez, lehengas, and graceful traditional wear.</p>
            <Link href="/shop?sort=discount" className="mt-6 inline-block"><Button>View Puja Offers</Button></Link>
          </div>
        </div>
      </section>

      {[
        ["Loved by customers", "Best sellers", bestSellers],
        ["Wedding edit", "Bridal collection", bridal],
        ["Timeless drape", "Saree collection", sarees],
        ["Everyday elegance", "Salwar Kameez collection", salwar]
      ].map(([eyebrow, title, list]) => (
        <section key={String(title)} className="container py-12">
          {sectionTitle(String(eyebrow), String(title))}
          <div className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
            {(list as Product[]).map((product) => <ProductCard key={product.id} product={product} />)}
          </div>
        </section>
      ))}

      <section className="bg-blush py-14">
        <div className="container grid gap-8 md:grid-cols-[.9fr_1.1fr]">
          <div>
            <p className="text-xs font-black uppercase tracking-[.26em] text-saffron">Why choose us</p>
            <h2 className="mt-2 font-display text-4xl font-black">Elegance with practical care</h2>
            <p className="mt-4 leading-7 text-warmgrey">Bandhan blends premium styling with Bangladesh-ready checkout, clear stock, delivery zones, COD, and integration-ready online payments.</p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {["Curated women&apos;s fashion", "Verified product variants", "Transparent delivery fees", "Responsive customer support"].map((item) => (
              <div key={item} className="rounded-md bg-white p-5 shadow-card">
                <Sparkles className="h-5 w-5 text-saffron" />
                <p className="mt-3 font-bold" dangerouslySetInnerHTML={{ __html: item }} />
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="container py-14">
        {sectionTitle("Customer voices", "What shoppers say")}
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {["Beautiful finishing and fast Dhaka delivery.", "The saree color looked exactly like the photo.", "Checkout was easy and COD made ordering simple."].map((quote, index) => (
            <blockquote key={quote} className="rounded-md bg-white p-6 shadow-card">
              <p className="text-saffron">★★★★★</p>
              <p className="mt-3 leading-7 text-warmgrey">{quote}</p>
              <footer className="mt-4 font-bold">Demo Customer {index + 1}</footer>
            </blockquote>
          ))}
        </div>
      </section>

      <section className="bg-white py-14">
        <div className="container">
          {sectionTitle("Follow the edit", "Instagram-style gallery")}
          <div className="mt-8 grid grid-cols-3 gap-2 md:grid-cols-6">
            {products.slice(0, 6).map((product) => (
              <div key={product.id} className="relative aspect-square overflow-hidden rounded-md bg-blush">
                <ProductImage src={product.images[0]} alt={product.name} fill className="object-cover" />
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="container py-14">
        <form className="mx-auto grid max-w-2xl gap-4 rounded-md bg-rosewood p-8 text-center text-white shadow-soft">
          <h2 className="font-display text-3xl font-black">Join Bandhan updates</h2>
          <p className="text-white/75">New arrivals, festive edits, and private sale alerts.</p>
          <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
            <input type="email" required placeholder="Email address" className="h-12 rounded-md border border-white/20 bg-white px-4 text-ink outline-none" />
            <Button type="submit" variant="secondary">Subscribe</Button>
          </div>
        </form>
      </section>
    </main>
  );
}
