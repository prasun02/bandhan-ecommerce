import "server-only";
import { PublicationStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { categoryCreateSchema, productCreateSchema, productUpdateSchema } from "@/lib/validations";
import { slugify } from "@/lib/utils";

type Actor = { id: string; role: "ADMIN" | "STAFF" | "CUSTOMER" };

function assertCanManageCatalog(actor: Actor) {
  if (actor.role !== "ADMIN" && actor.role !== "STAFF") {
    throw new Error("Admin authorization required.");
  }
}

export async function createCategory(input: unknown, actor: Actor) {
  assertCanManageCatalog(actor);
  const data = categoryCreateSchema.parse(input);
  const slug = data.slug ?? slugify(data.name);

  return prisma.$transaction(async (tx) => {
    const category = await tx.category.create({
      data: {
        name: data.name,
        slug,
        parentId: data.parentId || null,
        description: data.description,
        imageUrl: data.imageUrl || null,
        isActive: data.isActive,
        sortOrder: data.sortOrder
      }
    });

    await tx.auditLog.create({
      data: { userId: actor.id, action: "CREATE_CATEGORY", entity: "Category", entityId: category.id, metadata: { slug } }
    });

    return category;
  });
}

export async function createProduct(input: unknown, actor: Actor) {
  assertCanManageCatalog(actor);
  const data = productCreateSchema.parse(input);
  const slug = data.slug ?? slugify(data.name);

  return prisma.$transaction(async (tx) => {
    const product = await tx.product.create({
      data: {
        name: data.name,
        slug,
        sku: data.sku,
        shortDescription: data.shortDescription,
        description: data.description,
        categoryId: data.categoryId,
        collectionId: data.collectionId || null,
        brandId: data.brandId || null,
        fabricType: data.fabricType,
        occasion: data.occasion,
        regularPrice: data.regularPrice,
        salePrice: data.salePrice,
        costPrice: data.costPrice,
        stockQuantity: data.stockQuantity,
        lowStockLimit: data.lowStockLimit,
        featuredImageUrl: data.featuredImageUrl || data.images[0]?.url,
        status: data.status as PublicationStatus,
        tags: data.tags,
        images: {
          create: data.images.map((image, sortOrder) => ({ url: image.url, altText: image.altText ?? data.name, sortOrder }))
        },
        variants: {
          create: data.variants.map((variant) => ({
            sku: variant.sku,
            size: variant.size,
            color: variant.color,
            priceAdjustment: variant.priceAdjustment,
            stockQuantity: variant.stockQuantity,
            imageUrl: variant.imageUrl || null
          }))
        }
      },
      include: { images: true, variants: true }
    });

    await tx.inventoryMovement.create({
      data: { productId: product.id, quantity: data.stockQuantity, reason: "INITIAL_STOCK", note: "Product created from admin dashboard." }
    });

    for (const variant of product.variants) {
      await tx.inventoryMovement.create({
        data: { productId: product.id, variantId: variant.id, quantity: variant.stockQuantity, reason: "INITIAL_VARIANT_STOCK" }
      });
    }

    await tx.auditLog.create({
      data: { userId: actor.id, action: "CREATE_PRODUCT", entity: "Product", entityId: product.id, metadata: { sku: product.sku, slug } }
    });

    return product;
  });
}

export async function updateProduct(input: unknown, actor: Actor) {
  assertCanManageCatalog(actor);
  const data = productUpdateSchema.parse(input);
  const product = await prisma.product.update({
    where: { id: data.productId },
    data: {
      regularPrice: data.regularPrice,
      salePrice: data.salePrice,
      stockQuantity: data.stockQuantity,
      status: data.status as PublicationStatus | undefined
    }
  });
  await prisma.auditLog.create({
    data: { userId: actor.id, action: "UPDATE_PRODUCT", entity: "Product", entityId: product.id, metadata: data }
  });
  return product;
}
