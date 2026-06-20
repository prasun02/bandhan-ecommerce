"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ProductImage } from "@/components/product-image";

const slides = [
  { title: "Bandhan Puja Collection 2026", subtitle: "Celebrate tradition with timeless festive styles", button: "Shop Puja Collection", href: "/shop?collection=Puja%20Collection", image: "/images/banners/hero-eid.svg" },
  { title: "Festive Saree Edit", subtitle: "Elegant sarees selected for every Puja celebration", button: "Explore Sarees", href: "/shop?category=Sarees", image: "/images/banners/hero-saree.svg" },
  { title: "Puja Special Offer", subtitle: "Save up to 25% on selected festive collections", button: "View Offers", href: "/shop?sort=discount", image: "/images/banners/hero-sale.svg" },
  { title: "Traditional Elegance", subtitle: "Salwar kameez, lehengas, kurtis, and more", button: "Shop Festive Wear", href: "/shop", image: "/images/banners/hero-bridal.svg" }
];

export function HeroSlider() {
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const touchStart = useRef<number | null>(null);

  useEffect(() => {
    if (paused) return;
    const id = window.setInterval(() => setActive((current) => (current + 1) % slides.length), 5000);
    return () => window.clearInterval(id);
  }, [paused]);

  function move(direction: number) {
    setActive((current) => (current + direction + slides.length) % slides.length);
  }

  return (
    <section
      className="relative overflow-hidden bg-blush"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onTouchStart={(event) => { touchStart.current = event.touches[0]?.clientX ?? null; }}
      onTouchEnd={(event) => {
        if (touchStart.current === null) return;
        const diff = touchStart.current - (event.changedTouches[0]?.clientX ?? touchStart.current);
        if (Math.abs(diff) > 40) move(diff > 0 ? 1 : -1);
        touchStart.current = null;
      }}
    >
      <div className="relative min-h-[620px] md:min-h-[700px]">
        {slides.map((slide, index) => (
          <div key={slide.title} className={`absolute inset-0 transition-opacity duration-700 ${active === index ? "opacity-100" : "pointer-events-none opacity-0"}`}>
            <ProductImage src={slide.image} alt={slide.title} fill priority={index === 0} className="object-cover" sizes="100vw" />
            <div className="absolute inset-0 bg-gradient-to-r from-ink/75 via-ink/38 to-transparent" />
            <div className="container relative z-10 flex min-h-[620px] items-center py-20 md:min-h-[700px]">
              <div className="max-w-2xl text-white">
                <p className="text-sm font-bold uppercase tracking-[.28em] text-saffron">Bandhan</p>
                <h1 className="mt-4 font-display text-5xl font-black leading-tight md:text-7xl">{slide.title}</h1>
                <p className="mt-5 max-w-xl text-lg leading-8 text-white/85">{slide.subtitle}</p>
                <Link href={slide.href} className="mt-8 inline-block">
                  <Button>{slide.button}</Button>
                </Link>
              </div>
            </div>
          </div>
        ))}
      </div>
      <button aria-label="Previous slide" onClick={() => move(-1)} className="absolute left-4 top-1/2 z-20 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-full bg-white/85 text-rosewood shadow-card">
        <ChevronLeft className="h-5 w-5" />
      </button>
      <button aria-label="Next slide" onClick={() => move(1)} className="absolute right-4 top-1/2 z-20 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-full bg-white/85 text-rosewood shadow-card">
        <ChevronRight className="h-5 w-5" />
      </button>
      <div className="absolute bottom-6 left-1/2 z-20 flex -translate-x-1/2 gap-2">
        {slides.map((slide, index) => (
          <button key={slide.title} aria-label={`Show ${slide.title}`} onClick={() => setActive(index)} className={`h-2.5 rounded-full transition-all ${active === index ? "w-9 bg-saffron" : "w-2.5 bg-white/70"}`} />
        ))}
      </div>
    </section>
  );
}
