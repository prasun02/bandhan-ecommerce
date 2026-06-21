import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is required to verify demo products.");
}

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString }) });

async function main() {
  const [products, published, variants, images, zones, coupons, sample] = await Promise.all([
    prisma.product.count({ where: { sku: { startsWith: "BD-CSV-" } } }),
    prisma.product.count({ where: { sku: { startsWith: "BD-CSV-" }, status: "PUBLISHED", deletedAt: null } }),
    prisma.productVariant.count({ where: { product: { sku: { startsWith: "BD-CSV-" } } } }),
    prisma.productImage.count({ where: { product: { sku: { startsWith: "BD-CSV-" } } } }),
    prisma.deliveryZone.count({ where: { id: { in: ["dhaka", "outside", "remote"] } } }),
    prisma.coupon.count({ where: { code: { in: ["WELCOME10", "PUJA500", "FREEDHAKA"] } } }),
    prisma.product.findFirst({
      where: { sku: "BD-CSV-002" },
      include: { variants: true, images: true, category: true, collection: true, brand: true }
    })
  ]);

  console.log(JSON.stringify({
    products,
    published,
    variants,
    images,
    zones,
    coupons,
    sample: sample && {
      sku: sample.sku,
      status: sample.status,
      variantCount: sample.variants.length,
      imageCount: sample.images.length,
      category: sample.category.name,
      collection: sample.collection?.name,
      brand: sample.brand?.name,
      regularPrice: sample.regularPrice,
      salePrice: sample.salePrice,
      stock: sample.stockQuantity
    }
  }, null, 2));
}

main()
  .catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : "Demo product verification failed.");
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
