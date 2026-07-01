import Link from "next/link";
import { ChevronDown, Heart, Menu, Phone, Search, ShoppingBag, UserRound } from "lucide-react";
import { categories } from "@/data/catalog";
import { cookies } from "next/headers";
import { getCurrentUser } from "@/lib/auth";
import { CART_COOKIE, getCartSummary } from "@/lib/services/cart";
import { LogoutButton } from "@/components/logout-button";

const navItems = [
  ["Home", "/"],
  ["New Arrivals", "/shop?sort=newest"],
  ["Sarees", "/shop?category=Sarees"],
  ["Salwar Kameez", "/shop?category=Salwar%20Kameez"],
  ["Lehengas", "/shop?category=Lehengas"],
  ["Kurtis", "/shop?category=Kurtis"],
  ["Bridal", "/shop?category=Bridal%20Collection"],
  ["Puja Collection", "/shop?collection=Puja%20Collection"],
  ["Puja Offer", "/shop?sort=discount"],
  ["Track Order", "/track-order"]
];

export async function Header() {
  const [user, cookieStore] = await Promise.all([getCurrentUser(), cookies()]);
  const guestKey = cookieStore.get(CART_COOKIE)?.value;
  const cart = await getCartSummary(user ? { userId: user.id } : guestKey ? { guestKey } : undefined)
    .catch(() => ({ totalQuantity: 0 }));
  const firstName = user?.name?.trim().split(/\s+/)[0];
  return (
    <header className="sticky top-0 z-30 border-b border-rosewood/10 bg-ivory/95 shadow-sm backdrop-blur">
      <div className="bg-rosewood px-3 py-2 text-center text-xs font-semibold tracking-wide text-white">
        Upcoming Puja Offer - Special discounts on selected collections - Cash on Delivery available nationwide
      </div>
      <div className="container flex min-h-20 items-center gap-4">
        <Link href="/" className="shrink-0">
          <span className="block font-display text-2xl font-black leading-6 text-rosewood">Bandhan</span>
          <span className="hidden text-[11px] uppercase tracking-[.18em] text-warmgrey sm:block">Tradition Woven with Elegance</span>
        </Link>
        <form action="/shop" className="hidden min-w-0 max-w-2xl flex-1 items-center rounded-full border border-rosewood/15 bg-white px-4 shadow-sm md:flex">
          <Search className="h-4 w-4 shrink-0 text-warmgrey" />
          <input name="q" className="h-11 min-w-0 flex-1 bg-transparent px-3 text-sm outline-none" placeholder="Search products, sarees, salwar kameez, lehengas, and kurtis" />
        </form>
        <nav className="hidden items-center gap-3 whitespace-nowrap text-sm font-semibold text-ink 2xl:flex">
          {navItems.map(([label, href]) => (
            <Link key={label} href={href} className="rounded-md px-1.5 py-2 hover:bg-blush hover:text-rosewood focus-visible:outline focus-visible:outline-2 focus-visible:outline-saffron">
              {label}
            </Link>
          ))}
        </nav>
        <div className="ml-auto flex items-center gap-2">
          <a href="tel:+8801700000000" className="hidden items-center gap-2 whitespace-nowrap rounded-full bg-blush px-3 py-2 text-xs font-bold text-rosewood 2xl:flex">
            <Phone className="h-3.5 w-3.5" /> +880 1700-000000
          </a>
          <Link href={user ? "/account" : "/login"} aria-label={user ? "My Account" : "Login"} className="flex items-center gap-1 rounded-md p-2 hover:bg-ink/5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-saffron">
            <UserRound className="h-5 w-5" />
            {firstName ? <span className="hidden text-xs font-bold sm:inline">{firstName}</span> : null}
          </Link>
          <Link href="/account/wishlist" aria-label="Wishlist" className="relative rounded-md p-2 hover:bg-ink/5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-saffron">
            <Heart className="h-5 w-5" />
            <span className="absolute -right-1 -top-1 grid h-5 w-5 place-items-center rounded-full bg-white text-[10px] font-black text-rosewood">0</span>
          </Link>
          <Link href="/cart" aria-label="Cart" className="relative rounded-md p-2 hover:bg-ink/5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-saffron">
            <ShoppingBag className="h-5 w-5" />
            <span className="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-saffron px-1 text-[10px] font-black text-ink">{cart.totalQuantity}</span>
          </Link>
          {user ? <LogoutButton className="hidden text-xs font-bold text-rosewood xl:block" /> : null}
          <button aria-label="Menu" className="rounded-md p-2 hover:bg-ink/5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-saffron 2xl:hidden">
            <Menu className="h-5 w-5" />
          </button>
        </div>
      </div>
      <div className="container hidden gap-3 overflow-x-auto pb-3 text-sm md:flex 2xl:hidden">
        <div className="flex shrink-0 items-center gap-1 rounded-full border border-saffron/35 bg-white px-4 py-2 font-bold text-rosewood">
          Categories <ChevronDown className="h-4 w-4" />
        </div>
        {categories.slice(0, 6).map((category) => (
          <Link key={category} href={`/shop?category=${encodeURIComponent(category)}`} className="shrink-0 rounded-full bg-white px-4 py-2 text-warmgrey shadow-sm hover:text-rosewood">
            {category}
          </Link>
        ))}
        <Link href="/track-order" className="shrink-0 rounded-full bg-white px-4 py-2 text-warmgrey shadow-sm hover:text-rosewood">Track Order</Link>
      </div>
    </header>
  );
}
