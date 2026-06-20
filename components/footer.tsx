import Link from "next/link";

export function Footer() {
  return (
    <footer className="mt-16 border-t border-rosewood/10 bg-[#2B2527] text-white">
      <div className="container grid gap-8 py-12 md:grid-cols-4">
        <div>
          <h2 className="font-display text-2xl font-black text-white">Bandhan</h2>
          <p className="mt-3 text-sm leading-6 text-white/70">Tradition Woven with Elegance. Premium sarees, salwar kameez, lehengas, gowns, kurtis, and fabric for Bangladesh.</p>
          <div className="mt-5 flex flex-wrap gap-2 text-xs font-bold">
            {["bKash", "Visa", "Mastercard", "Cash on Delivery"].map((item) => <span key={item} className="rounded-full border border-saffron/50 px-3 py-1 text-saffron">{item}</span>)}
          </div>
        </div>
        {[
          ["Shop", "New arrivals", "Best sellers", "Puja offer", "Bridal"],
          ["Customer Service", "Size guide", "Delivery information", "Return policy", "Track order"],
          ["Contact", "+880 1700-000000", "support@bandhan.test", "Dhaka, Bangladesh"]
        ].map(([title, ...links]) => (
          <div key={title}>
            <h3 className="font-bold text-saffron">{title}</h3>
            <div className="mt-3 grid gap-2 text-sm text-white/70">
              {links.map((link) => (
                <Link key={link} href={`/${link.toLowerCase().replaceAll(" ", "-")}`}>
                  {link}
                </Link>
              ))}
            </div>
          </div>
        ))}
      </div>
      <div className="border-t border-white/10 py-5 text-center text-xs text-white/55">&copy; {new Date().getFullYear()} Bandhan. Demo storefront for production e-commerce workflows.</div>
    </footer>
  );
}
