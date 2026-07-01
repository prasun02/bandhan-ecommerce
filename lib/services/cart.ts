import "server-only";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { cartUpsertSchema } from "@/lib/validations";

export const CART_COOKIE = "bandhan_cart";
export type CartOwner = { userId?: string; guestKey?: string };

function ownerWhere(owner: CartOwner) {
  if (owner.userId) return { userId: owner.userId };
  if (owner.guestKey) return { guestKey: owner.guestKey };
  throw new Error("Cart owner is required.");
}

const cartInclude = {
  items: {
    orderBy: { id: "asc" as const },
    include: {
      product: { include: { images: { orderBy: { sortOrder: "asc" as const }, take: 1 } } },
      variant: true
    }
  }
};

export type CartWithItems = Prisma.CartGetPayload<{ include: typeof cartInclude }>;

export function summarizeCart(cart: CartWithItems | null) {
  const lines = (cart?.items ?? []).map((item) => {
    const unitPrice = (item.product.salePrice ?? item.product.regularPrice) + (item.variant?.priceAdjustment ?? 0);
    const availableStock = item.variant?.stockQuantity ?? item.product.stockQuantity;
    return {
      id: item.id,
      productId: item.productId,
      variantId: item.variantId ?? undefined,
      name: item.product.name,
      slug: item.product.slug,
      sku: item.variant?.sku ?? item.product.sku,
      image: item.variant?.imageUrl ?? item.product.featuredImageUrl ?? item.product.images[0]?.url ?? "",
      size: item.variant?.size ?? undefined,
      color: item.variant?.color ?? undefined,
      unitPrice,
      availableStock,
      quantity: item.quantity,
      subtotal: unitPrice * item.quantity
    };
  });
  const subtotal = lines.reduce((sum, line) => sum + line.subtotal, 0);
  return {
    lines,
    distinctLines: lines.length,
    totalQuantity: lines.reduce((sum, line) => sum + line.quantity, 0),
    subtotal,
    discount: 0,
    grandTotal: subtotal
  };
}

export async function upsertCartItem(input: unknown, owner: CartOwner) {
  const data = cartUpsertSchema.parse(input);
  return prisma.$transaction(async (tx) => {
    const ownerKey = ownerWhere(owner);
    const existingCart = await tx.cart.findFirst({ where: ownerKey });
    const cart = existingCart ?? (await tx.cart.create({ data: ownerKey }));

    const product = await tx.product.findUnique({
      where: { id: data.productId },
      include: { variants: true }
    });
    if (!product || product.deletedAt || product.status !== "PUBLISHED") throw new Error("Product is currently unavailable.");

    const variant = data.variantId ? product.variants.find((item) => item.id === data.variantId) : null;
    if (product.variants.length > 0 && !data.variantId) throw new Error("Please select a color and size.");
    if (data.variantId && !variant) throw new Error("This combination is unavailable.");
    if (variant && !variant.isAvailable) throw new Error("This combination is unavailable.");
    const availableStock = variant?.stockQuantity ?? product.stockQuantity;
    if (availableStock < 1) throw new Error("Product is currently unavailable.");

    const existingItem = await tx.cartItem.findFirst({
      where: { cartId: cart.id, productId: data.productId, variantId: data.variantId ?? null }
    });
    const nextQuantity = data.mode === "increment" && existingItem ? existingItem.quantity + data.quantity : data.quantity;
    if (nextQuantity > availableStock) throw new Error(`Only ${availableStock} items are currently available.`);

    if (existingItem) {
      await tx.cartItem.update({ where: { id: existingItem.id }, data: { quantity: nextQuantity } });
    } else {
      await tx.cartItem.create({
        data: { cartId: cart.id, productId: data.productId, variantId: data.variantId, quantity: data.quantity }
      });
    }
    return tx.cart.findUniqueOrThrow({ where: { id: cart.id }, include: cartInclude });
  });
}

export async function getCart(owner: CartOwner) {
  return prisma.cart.findFirst({ where: ownerWhere(owner), include: cartInclude });
}

export async function getCartSummary(owner?: CartOwner) {
  if (!owner?.userId && !owner?.guestKey) return summarizeCart(null);
  return summarizeCart(await getCart(owner));
}

export async function removeCartItem(itemId: string, owner: CartOwner) {
  const cart = await prisma.cart.findFirst({ where: ownerWhere(owner), select: { id: true } });
  if (!cart) return summarizeCart(null);
  await prisma.cartItem.deleteMany({ where: { id: itemId, cartId: cart.id } });
  return getCartSummary(owner);
}

export async function mergeGuestCart(userId: string, guestKey?: string) {
  if (!guestKey) return getCartSummary({ userId });
  return prisma.$transaction(async (tx) => {
    const guestCart = await tx.cart.findUnique({
      where: { guestKey },
      include: { items: { include: { product: true, variant: true } } }
    });
    let userCart = await tx.cart.findUnique({ where: { userId } });
    if (!userCart) userCart = await tx.cart.create({ data: { userId } });
    if (!guestCart || guestCart.id === userCart.id) {
      return summarizeCart(await tx.cart.findUnique({ where: { id: userCart.id }, include: cartInclude }));
    }

    for (const item of guestCart.items) {
      if (item.product.deletedAt || item.product.status !== "PUBLISHED") continue;
      const stock = item.variant?.stockQuantity ?? item.product.stockQuantity;
      if (stock < 1 || (item.variant && !item.variant.isAvailable)) continue;
      const existing = await tx.cartItem.findFirst({
        where: {
          cartId: userCart.id,
          productId: item.productId,
          variantId: item.variantId
        }
      });
      const quantity = Math.min(stock, item.quantity + (existing?.quantity ?? 0));
      if (existing) {
        await tx.cartItem.update({ where: { id: existing.id }, data: { quantity } });
      } else {
        await tx.cartItem.create({
          data: {
            cartId: userCart.id,
            productId: item.productId,
            variantId: item.variantId,
            quantity
          }
        });
      }
    }
    await tx.cart.delete({ where: { id: guestCart.id } });
    return summarizeCart(await tx.cart.findUnique({ where: { id: userCart.id }, include: cartInclude }));
  });
}
