import { PrismaClient, PublicationStatus, ReviewStatus, UserRole } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";
import { brands, categories, collections, coupons, deliveryZones, products } from "../data/catalog";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) throw new Error("DATABASE_URL is required for seeding.");
const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString }) });

async function main() {
  const adminPassword = process.env.SEED_ADMIN_PASSWORD;
  const customerPassword = process.env.SEED_CUSTOMER_PASSWORD;
  if (!adminPassword || !customerPassword) {
    throw new Error("Set SEED_ADMIN_PASSWORD and SEED_CUSTOMER_PASSWORD before running prisma:seed.");
  }

  const categoryMap = new Map<string, string>();
  for (const name of categories) {
    const category = await prisma.category.upsert({
      where: { slug: name.toLowerCase().replace(/[^a-z0-9]+/g, "-") },
      update: { name, isActive: true },
      create: { name, slug: name.toLowerCase().replace(/[^a-z0-9]+/g, "-"), isActive: true }
    });
    categoryMap.set(name, category.id);
  }

  const collectionMap = new Map<string, string>();
  for (const name of collections) {
    const collection = await prisma.collection.upsert({
      where: { slug: name.toLowerCase().replace(/[^a-z0-9]+/g, "-") },
      update: { name, isActive: true },
      create: { name, slug: name.toLowerCase().replace(/[^a-z0-9]+/g, "-"), isActive: true }
    });
    collectionMap.set(name, collection.id);
  }

  const brandMap = new Map<string, string>();
  for (const name of brands) {
    const brand = await prisma.brand.upsert({
      where: { slug: name.toLowerCase().replace(/[^a-z0-9]+/g, "-") },
      update: { name },
      create: { name, slug: name.toLowerCase().replace(/[^a-z0-9]+/g, "-") }
    });
    brandMap.set(name, brand.id);
  }

  for (const product of products) {
    const uniqueProductImages = product.images.filter((url, index, list) => list.indexOf(url) === index);
    const dbProduct = await prisma.product.upsert({
      where: { slug: product.slug },
      update: {
        name: product.name,
        sku: product.sku,
        shortDescription: product.shortDescription,
        description: product.description,
        categoryId: categoryMap.get(product.category)!,
        collectionId: collectionMap.get(product.collection),
        brandId: brandMap.get(product.brand),
        fabricType: product.fabric,
        occasion: product.occasion,
        regularPrice: product.regularPrice,
        salePrice: product.salePrice,
        costPrice: product.costPrice,
        featuredImageUrl: product.images[0],
        stitchingType: product.stitching,
        stockQuantity: product.stock,
        tags: product.tags,
        featured: product.featured,
        newArrival: product.newArrival,
        bestSeller: product.bestSeller,
        status: PublicationStatus.PUBLISHED,
        careInstructions: product.care,
        packageContents: product.packageContents,
        estimatedDeliveryTime: product.deliveryEstimate,
        seoTitle: product.seoTitle,
        seoDescription: product.seoDescription
      },
      create: {
        id: product.id,
        name: product.name,
        slug: product.slug,
        sku: product.sku,
        shortDescription: product.shortDescription,
        description: product.description,
        categoryId: categoryMap.get(product.category)!,
        collectionId: collectionMap.get(product.collection),
        brandId: brandMap.get(product.brand),
        fabricType: product.fabric,
        occasion: product.occasion,
        regularPrice: product.regularPrice,
        salePrice: product.salePrice,
        costPrice: product.costPrice,
        featuredImageUrl: product.images[0],
        stitchingType: product.stitching,
        stockQuantity: product.stock,
        tags: product.tags,
        featured: product.featured,
        newArrival: product.newArrival,
        bestSeller: product.bestSeller,
        status: PublicationStatus.PUBLISHED,
        estimatedDeliveryTime: product.deliveryEstimate,
        seoTitle: product.seoTitle,
        seoDescription: product.seoDescription,
        careInstructions: product.care,
        packageContents: product.packageContents,
        images: { create: uniqueProductImages.map((url, sortOrder) => ({ url, altText: product.name, sortOrder })) },
        variants: { create: product.variants.map((variant) => ({ id: variant.id, sku: variant.sku, size: variant.size, color: variant.color, stockQuantity: variant.stock, priceAdjustment: variant.priceAdjustment, imageUrl: variant.image })) }
      }
    });

    await prisma.productImage.deleteMany({ where: { productId: dbProduct.id } });
    await prisma.productImage.createMany({
      data: uniqueProductImages.map((url, sortOrder) => ({ productId: dbProduct.id, url, altText: product.name, sortOrder }))
    });
    for (const variant of product.variants) {
      await prisma.productVariant.upsert({
        where: { sku: variant.sku },
        update: { size: variant.size, color: variant.color, stockQuantity: variant.stock, priceAdjustment: variant.priceAdjustment, imageUrl: variant.image, isAvailable: true },
        create: { id: variant.id, productId: dbProduct.id, sku: variant.sku, size: variant.size, color: variant.color, stockQuantity: variant.stock, priceAdjustment: variant.priceAdjustment, imageUrl: variant.image, isAvailable: true }
      });
    }
  }

  for (const zone of deliveryZones) {
    await prisma.deliveryZone.upsert({
      where: { id: zone.id },
      update: { name: zone.name, division: zone.division, deliveryCharge: zone.charge, codCharge: zone.codCharge, minDeliveryDays: zone.minDays, maxDeliveryDays: zone.maxDays, freeDeliveryThreshold: zone.freeThreshold, active: true },
      create: { id: zone.id, name: zone.name, division: zone.division, deliveryCharge: zone.charge, codCharge: zone.codCharge, minDeliveryDays: zone.minDays, maxDeliveryDays: zone.maxDays, freeDeliveryThreshold: zone.freeThreshold }
    });
  }

  for (const coupon of coupons) {
    await prisma.coupon.upsert({
      where: { code: coupon.code },
      update: {},
      create: {
        code: coupon.code,
        description: `${coupon.code} launch offer`,
        percentage: coupon.type === "percentage" ? coupon.value : null,
        fixedAmount: coupon.type === "fixed" ? coupon.value : null,
        freeDelivery: coupon.type === "free-delivery",
        minimumOrder: coupon.minSubtotal,
        maximumDiscount: "maxDiscount" in coupon ? coupon.maxDiscount : null,
        active: coupon.active
      }
    });
  }

  await prisma.siteSetting.upsert({
    where: { key: "business.name" },
    update: { value: "Bandhan", group: "brand" },
    create: { key: "business.name", value: "Bandhan", group: "brand" }
  });
  await prisma.siteSetting.upsert({
    where: { key: "business.tagline" },
    update: { value: "Tradition Woven with Elegance", group: "brand" },
    create: { key: "business.tagline", value: "Tradition Woven with Elegance", group: "brand" }
  });

  await prisma.user.upsert({
    where: { email: process.env.SEED_ADMIN_EMAIL ?? "admin@example.com" },
    update: {},
    create: {
      email: process.env.SEED_ADMIN_EMAIL ?? "admin@example.com",
      name: "Demo Admin",
      role: UserRole.ADMIN,
      passwordHash: await bcrypt.hash(adminPassword, 12)
    }
  });

  const customer = await prisma.user.upsert({
    where: { email: process.env.SEED_CUSTOMER_EMAIL ?? "customer@example.com" },
    update: {},
    create: {
      email: process.env.SEED_CUSTOMER_EMAIL ?? "customer@example.com",
      name: "Demo Customer",
      role: UserRole.CUSTOMER,
      passwordHash: await bcrypt.hash(customerPassword, 12)
    }
  });

  for (const product of products.slice(0, 12)) {
    await prisma.review.upsert({
      where: {
        userId_productId: {
          userId: customer.id,
          productId: product.id
        }
      },
      update: { rating: Math.round(product.rating), title: "Beautiful quality", body: `${product.name} looks elegant and the fabric feels premium.`, verifiedPurchase: true, status: ReviewStatus.APPROVED },
      create: {
        userId: customer.id,
        productId: product.id,
        rating: Math.round(product.rating),
        title: "Beautiful quality",
        body: `${product.name} looks elegant and the fabric feels premium.`,
        verifiedPurchase: true,
        status: ReviewStatus.APPROVED
      }
    });
  }
}

main().finally(async () => prisma.$disconnect());
