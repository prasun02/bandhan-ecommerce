import "server-only";
import { products, type Product } from "@/data/catalog";
import { prisma } from "@/lib/prisma";

export type ProductFilters = {
  q?: string;
  category?: string;
  collection?: string;
  fabric?: string;
  size?: string;
  color?: string;
  stitched?: string;
  inStock?: string;
  sort?: string;
};

type DbProduct = Awaited<ReturnType<typeof getDbProductBySlug>>;

function uniqueImages(images: { id?: string; url: string; altText?: string | null }[], fallback?: string | null) {
  const seen = new Set<string>();
  const urls = [...images.map((image) => image.url), fallback].filter(Boolean) as string[];
  return urls.filter((url) => {
    if (seen.has(url)) return false;
    seen.add(url);
    return true;
  });
}

export function mapDbProductToStorefrontProduct(product: NonNullable<DbProduct>): Product {
  const images = uniqueImages(product.images, product.featuredImageUrl);
  const firstImage = images[0] ?? "/images/products/product-1.svg";
  const ratingSeed = product.id.split("").reduce((sum, char) => sum + char.charCodeAt(0), 0);

  return {
    id: product.id,
    name: product.name,
    slug: product.slug,
    sku: product.sku,
    shortDescription: product.shortDescription,
    description: product.description,
    category: product.category.name,
    collection: product.collection?.name ?? "Puja Collection",
    brand: product.brand?.name ?? "Bandhan",
    fabric: product.fabricType ?? "Premium fabric",
    occasion: product.occasion ?? "Festival",
    stitching: (product.stitchingType as Product["stitching"]) ?? "Stitched",
    regularPrice: product.regularPrice,
    salePrice: product.salePrice ?? undefined,
    costPrice: product.costPrice ?? 0,
    images: images.length ? images : [firstImage],
    rating: Number((4.3 + (ratingSeed % 6) / 10).toFixed(1)),
    reviewCount: 12 + (ratingSeed % 80),
    tags: product.tags,
    featured: product.featured,
    newArrival: product.newArrival,
    bestSeller: product.bestSeller,
    stock: product.stockQuantity,
    variants: product.variants.map((variant) => ({
      id: variant.id,
      sku: variant.sku,
      size: variant.size ?? undefined,
      color: variant.color ?? undefined,
      stock: variant.stockQuantity,
      priceAdjustment: variant.priceAdjustment,
      image: variant.imageUrl ?? firstImage
    })),
    care: product.careInstructions ?? "Dry clean recommended. Store folded in a cool, dry place away from direct sunlight.",
    packageContents: product.packageContents ?? "1 main piece with matching components where applicable.",
    deliveryEstimate: product.estimatedDeliveryTime ?? "1-6 business days based on delivery zone",
    seoTitle: product.seoTitle ?? `${product.name} | Bandhan Bangladesh`,
    seoDescription: product.seoDescription ?? `Shop ${product.name} from Bandhan with secure checkout, COD, bKash, card options, and Bangladesh delivery.`
  };
}

export async function getDbProductBySlug(slug: string) {
  return prisma.product.findFirst({
    where: { slug, status: "PUBLISHED", deletedAt: null },
    include: {
      category: true,
      collection: true,
      brand: true,
      images: { orderBy: { sortOrder: "asc" } },
      variants: { orderBy: [{ color: "asc" }, { size: "asc" }] }
    }
  });
}

export async function getProductBySlug(slug: string) {
  const product = await getDbProductBySlug(slug);
  return product ? mapDbProductToStorefrontProduct(product) : null;
}

export async function getPublishedProducts(filters: ProductFilters = {}) {
  const dbProducts = await prisma.product.findMany({
    where: {
      status: "PUBLISHED",
      deletedAt: null,
      ...(filters.q
        ? {
            OR: [
              { name: { contains: filters.q, mode: "insensitive" } },
              { shortDescription: { contains: filters.q, mode: "insensitive" } },
              { sku: { contains: filters.q, mode: "insensitive" } }
            ]
          }
        : {}),
      ...(filters.category ? { category: { name: filters.category } } : {}),
      ...(filters.collection ? { collection: { name: filters.collection } } : {}),
      ...(filters.fabric ? { fabricType: { contains: filters.fabric, mode: "insensitive" } } : {}),
      ...(filters.inStock === "true" ? { stockQuantity: { gt: 0 } } : {})
    },
    include: {
      category: true,
      collection: true,
      brand: true,
      images: { orderBy: { sortOrder: "asc" } },
      variants: { orderBy: [{ color: "asc" }, { size: "asc" }] }
    }
  });

  let result = dbProducts.map(mapDbProductToStorefrontProduct).filter((product) => {
    const matchesSize = !filters.size || product.variants.some((variant) => variant.size === filters.size);
    const matchesColor = !filters.color || product.variants.some((variant) => variant.color === filters.color);
    const matchesStitched = !filters.stitched || product.stitching.toLowerCase().includes(filters.stitched.toLowerCase());
    return matchesSize && matchesColor && matchesStitched;
  });

  result = [...result].sort((a, b) => {
    const aPrice = a.salePrice ?? a.regularPrice;
    const bPrice = b.salePrice ?? b.regularPrice;
    if (filters.sort === "price-asc") return aPrice - bPrice;
    if (filters.sort === "price-desc") return bPrice - aPrice;
    if (filters.sort === "rating") return b.rating - a.rating;
    if (filters.sort === "discount") return (b.regularPrice - (b.salePrice ?? b.regularPrice)) - (a.regularPrice - (a.salePrice ?? a.regularPrice));
    return Number(b.newArrival) - Number(a.newArrival);
  });

  return result;
}

export function filterProducts(filters: ProductFilters) {
  const query = filters.q?.toLowerCase().trim();
  let result = products.filter((product) => {
    const matchesQuery = !query || [product.name, product.category, product.collection, product.fabric].join(" ").toLowerCase().includes(query);
    const matchesCategory = !filters.category || product.category === filters.category;
    const matchesCollection = !filters.collection || product.collection === filters.collection;
    const matchesFabric = !filters.fabric || product.fabric === filters.fabric;
    const matchesSize = !filters.size || product.variants.some((variant) => variant.size === filters.size);
    const matchesColor = !filters.color || product.variants.some((variant) => variant.color === filters.color);
    const matchesStitched = !filters.stitched || product.stitching.toLowerCase().includes(filters.stitched.toLowerCase());
    const matchesStock = filters.inStock !== "true" || product.stock > 0;
    return matchesQuery && matchesCategory && matchesCollection && matchesFabric && matchesSize && matchesColor && matchesStitched && matchesStock;
  });

  result = [...result].sort((a, b) => {
    const aPrice = a.salePrice ?? a.regularPrice;
    const bPrice = b.salePrice ?? b.regularPrice;
    if (filters.sort === "price-asc") return aPrice - bPrice;
    if (filters.sort === "price-desc") return bPrice - aPrice;
    if (filters.sort === "rating") return b.rating - a.rating;
    if (filters.sort === "discount") return (b.regularPrice - (b.salePrice ?? b.regularPrice)) - (a.regularPrice - (a.salePrice ?? a.regularPrice));
    return Number(b.newArrival) - Number(a.newArrival);
  });

  return result;
}
