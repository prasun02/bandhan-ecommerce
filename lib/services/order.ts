import { products } from "@/data/catalog";
import { checkoutSchema, type CheckoutInput } from "@/lib/validations";
import { applyCoupon } from "@/lib/services/coupon";
import { calculateDelivery } from "@/lib/services/delivery";

export type CartLineInput = { productId: string; variantId?: string; quantity: number };

export function createOrderNumber(sequence = 1, date = new Date()) {
  return `ORD-${date.getFullYear()}-${String(sequence).padStart(6, "0")}`;
}

export function calculateCart(lines: CartLineInput[], couponCode: string | undefined, deliveryZoneId: string, paymentMethod: CheckoutInput["paymentMethod"]) {
  const items = lines.map((line) => {
    const product = products.find((entry) => entry.id === line.productId);
    if (!product) throw new Error("Product not found.");
    const variant = line.variantId ? product.variants.find((entry) => entry.id === line.variantId) : undefined;
    if (product.variants.length > 0 && !variant) throw new Error("Please select all required product options.");
    const availableStock = variant?.stock ?? product.stock;
    if (line.quantity > availableStock) throw new Error(`${product.name} has only ${availableStock} available.`);
    const unitPrice = (product.salePrice ?? product.regularPrice) + (variant?.priceAdjustment ?? 0);
    return {
      productId: product.id,
      variantId: variant?.id,
      name: product.name,
      sku: variant?.sku ?? product.sku,
      image: variant?.image ?? product.images[0],
      size: variant?.size,
      color: variant?.color,
      quantity: line.quantity,
      unitPrice,
      subtotal: unitPrice * line.quantity
    };
  });

  const subtotal = items.reduce((sum, item) => sum + item.subtotal, 0);
  const delivery = calculateDelivery(deliveryZoneId, subtotal, paymentMethod);
  const coupon = applyCoupon(couponCode, subtotal, delivery.charge);
  const deliveryCharge = Math.max(0, delivery.charge - coupon.deliveryDiscount);
  const total = Math.max(0, subtotal - coupon.discount + deliveryCharge);

  return { items, subtotal, discount: coupon.discount, deliveryCharge, total, delivery, coupon: coupon.coupon };
}

export function prepareOrder(input: unknown, lines: CartLineInput[]) {
  const checkout = checkoutSchema.parse(input);
  const totals = calculateCart(lines, checkout.couponCode, checkout.deliveryZoneId, checkout.paymentMethod);
  return {
    orderNumber: createOrderNumber(),
    checkout,
    ...totals,
    paymentStatus: checkout.paymentMethod === "cod" ? "Cash on Delivery Pending" : "Pending",
    statusHistory: [{ status: "Order Placed", note: "Order created after server-side stock and total validation." }]
  };
}
