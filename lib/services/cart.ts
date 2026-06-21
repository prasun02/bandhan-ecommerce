import "server-only";
import { prisma } from "@/lib/prisma";
import { cartUpsertSchema } from "@/lib/validations";

type CartOwner = { userId?: string; guestKey?: string };

function ownerWhere(owner: CartOwner) {
  if (owner.userId) return { userId: owner.userId };
  if (owner.guestKey) return { guestKey: owner.guestKey };
  throw new Error("Cart owner is required.");
}

export async function upsertCartItem(input: unknown, owner: CartOwner) {
  const data = cartUpsertSchema.parse(input);

  return prisma.$transaction(async (tx) => {
    const ownerKey = owner.userId ? { userId: owner.userId } : { guestKey: owner.guestKey ?? data.guestKey };
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
      return tx.cartItem.update({
        where: { id: existingItem.id },
        data: { quantity: nextQuantity },
        include: { product: true, variant: true }
      });
    }
    return tx.cartItem.create({
      data: { cartId: cart.id, productId: data.productId, variantId: data.variantId, quantity: data.quantity },
      include: { product: true, variant: true }
    });
  });
}

export async function getCart(owner: CartOwner) {
  return prisma.cart.findFirst({
    where: ownerWhere(owner),
    include: { items: { include: { product: { include: { images: true } }, variant: true } } }
  });
}
