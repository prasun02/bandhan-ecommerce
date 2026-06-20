import type { MetadataRoute } from "next";
import { products } from "@/data/catalog";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = process.env.APP_URL ?? "http://localhost:3000";
  return [
    "", "/shop", "/cart", "/checkout", "/track-order", "/about-us", "/contact-us",
    ...products.map((product) => `/product/${product.slug}`)
  ].map((path) => ({ url: `${base}${path}`, lastModified: new Date() }));
}
