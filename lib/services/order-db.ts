import { OrderStatus, PaymentMethod, PaymentStatus, Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { checkoutRequestSchema, adminOrderUpdateSchema, trackOrderSchema, type CheckoutInput } from "@/lib/validations";
import { createOrderNumber } from "@/lib/services/order";

type CartLine = { productId: string; variantId?: string; quantity: number };
type Actor = { id: string; role: "ADMIN" | "STAFF" | "CUSTOMER" };

function toPaymentMethod(method: CheckoutInput["paymentMethod"]) {
  if (method === "bkash") return PaymentMethod.BKASH;
  if (method === "card") return PaymentMethod.CARD;
  return PaymentMethod.COD;
}

function initialPaymentStatus(method: CheckoutInput["paymentMethod"]) {
  return method === "cod" ? PaymentStatus.COD_PENDING : PaymentStatus.PENDING;
}

function assertAdmin(actor: Actor) {
  if (actor.role !== "ADMIN" && actor.role !== "STAFF") throw new Error("Admin authorization required.");
}

async function calculateDbTotals(tx: Prisma.TransactionClient, lines: CartLine[], checkout: CheckoutInput) {
  const items = [];

  for (const line of lines) {
    const product = await tx.product.findUnique({ where: { id: line.productId }, include: { variants: true, images: true } });
    if (!product || product.deletedAt) throw new Error("Product not found.");
    const variant = line.variantId ? product.variants.find((entry) => entry.id === line.variantId) : null;
    if (product.variants.length > 0 && !variant) throw new Error("Select required size and color.");
    const stock = variant?.stockQuantity ?? product.stockQuantity;
    if (line.quantity > stock) throw new Error(`${product.name} has only ${stock} available.`);
    const unitPrice = (product.salePrice ?? product.regularPrice) + (variant?.priceAdjustment ?? 0);
    items.push({
      product,
      variant,
      productName: product.name,
      sku: variant?.sku ?? product.sku,
      imageUrl: variant?.imageUrl ?? product.featuredImageUrl ?? product.images[0]?.url,
      size: variant?.size,
      color: variant?.color,
      quantity: line.quantity,
      unitPrice,
      subtotal: unitPrice * line.quantity
    });
  }

  const subtotal = items.reduce((sum, item) => sum + item.subtotal, 0);
  const zone = await tx.deliveryZone.findFirst({ where: { id: checkout.deliveryZoneId, active: true } });
  if (!zone) throw new Error("Invalid delivery zone.");
  const free = zone.freeDeliveryThreshold !== null && subtotal >= zone.freeDeliveryThreshold;
  let deliveryCharge = free ? 0 : zone.deliveryCharge;
  if (checkout.paymentMethod === "cod") deliveryCharge += zone.codCharge;

  let discountTotal = 0;
  if (checkout.couponCode) {
    const coupon = await tx.coupon.findFirst({ where: { code: checkout.couponCode.toUpperCase(), active: true } });
    const now = new Date();
    const inWindow = coupon && (!coupon.startsAt || coupon.startsAt <= now) && (!coupon.endsAt || coupon.endsAt >= now);
    if (coupon && inWindow && (!coupon.minimumOrder || subtotal >= coupon.minimumOrder)) {
      if (coupon.percentage) discountTotal = Math.round((subtotal * coupon.percentage) / 100);
      if (coupon.fixedAmount) discountTotal += coupon.fixedAmount;
      if (coupon.maximumDiscount) discountTotal = Math.min(discountTotal, coupon.maximumDiscount);
      if (coupon.freeDelivery) deliveryCharge = 0;
    }
  }

  return {
    items,
    subtotal,
    discountTotal,
    deliveryCharge,
    total: Math.max(0, subtotal - discountTotal + deliveryCharge),
    zone
  };
}

export async function createOrder(input: unknown, userId?: string) {
  const request = checkoutRequestSchema.parse(input);
  const checkout = request.checkout;

  return prisma.$transaction(async (tx) => {
    const existing = await tx.order.findUnique({ where: { idempotencyKey: checkout.idempotencyKey } });
    if (existing) return existing;

    const lines = request.lines?.length
      ? request.lines
      : (await tx.cart.findFirst({
          where: userId ? { userId } : { guestKey: request.guestKey },
          include: { items: true }
        }))?.items.map((item) => ({ productId: item.productId, variantId: item.variantId ?? undefined, quantity: item.quantity })) ?? [];
    if (lines.length === 0) throw new Error("Cart is empty.");

    const totals = await calculateDbTotals(tx, lines, checkout);
    const year = new Date().getFullYear();
    const sequence = await tx.orderSequence.upsert({
      where: { year },
      update: { nextNumber: { increment: 1 } },
      create: { year, nextNumber: 2 }
    });
    const orderNumber = createOrderNumber(sequence.nextNumber - 1);
    const paymentMethod = toPaymentMethod(checkout.paymentMethod);
    const paymentStatus = initialPaymentStatus(checkout.paymentMethod);

    for (const item of totals.items) {
      if (item.variant) {
        const updated = await tx.productVariant.updateMany({
          where: { id: item.variant.id, stockQuantity: { gte: item.quantity } },
          data: { stockQuantity: { decrement: item.quantity } }
        });
        if (updated.count !== 1) throw new Error(`${item.productName} stock changed. Please review your cart.`);
      } else {
        const updated = await tx.product.updateMany({
          where: { id: item.product.id, stockQuantity: { gte: item.quantity } },
          data: { stockQuantity: { decrement: item.quantity } }
        });
        if (updated.count !== 1) throw new Error(`${item.productName} stock changed. Please review your cart.`);
      }
    }

    const order = await tx.order.create({
      data: {
        orderNumber,
        userId,
        customerName: checkout.fullName,
        customerPhone: checkout.phone,
        customerEmail: checkout.email || null,
        paymentMethod,
        paymentStatus,
        subtotal: totals.subtotal,
        discountTotal: totals.discountTotal,
        deliveryCharge: totals.deliveryCharge,
        total: totals.total,
        couponCode: checkout.couponCode?.toUpperCase(),
        deliveryMethod: totals.zone.name,
        estimatedDelivery: `${totals.zone.minDeliveryDays}-${totals.zone.maxDeliveryDays} business days`,
        idempotencyKey: checkout.idempotencyKey,
        address: {
          create: {
            fullName: checkout.fullName,
            phone: checkout.phone,
            division: checkout.division,
            district: checkout.district,
            upazila: checkout.upazila,
            area: checkout.area,
            street: checkout.street,
            postalCode: checkout.postalCode,
            landmark: checkout.landmark
          }
        },
        items: {
          create: totals.items.map((item) => ({
            productId: item.product.id,
            variantId: item.variant?.id,
            productName: item.productName,
            sku: item.sku,
            imageUrl: item.imageUrl,
            size: item.size,
            color: item.color,
            unitPrice: item.unitPrice,
            quantity: item.quantity,
            subtotal: item.subtotal
          }))
        },
        payments: {
          create: { method: paymentMethod, status: paymentStatus, amount: totals.total, provider: checkout.paymentMethod, reference: `${checkout.paymentMethod.toUpperCase()}-${orderNumber}` }
        },
        statusHistory: {
          create: { status: OrderStatus.ORDER_PLACED, note: "Order created after server-side stock, coupon, and delivery validation.", customerVisible: true }
        }
      },
      include: { items: true, address: true, statusHistory: true, payments: true }
    });

    for (const item of totals.items) {
      await tx.inventoryMovement.create({
        data: { productId: item.product.id, variantId: item.variant?.id, quantity: -item.quantity, reason: "ORDER_PLACED", reference: order.orderNumber }
      });
    }

    return order;
  });
}

export async function trackOrder(input: unknown) {
  const data = trackOrderSchema.parse(input);
  const order = await prisma.order.findFirst({
    where: { orderNumber: data.orderNumber, customerPhone: data.phone },
    select: {
      orderNumber: true,
      status: true,
      paymentStatus: true,
      createdAt: true,
      estimatedDelivery: true,
      shipment: true,
      statusHistory: {
        where: { customerVisible: true },
        orderBy: { createdAt: "asc" },
        select: { status: true, note: true, createdAt: true }
      }
    }
  });
  if (!order) throw new Error("Order not found.");
  return order;
}

export async function updateOrderStatus(input: unknown, actor: Actor) {
  assertAdmin(actor);
  const data = adminOrderUpdateSchema.parse(input);

  return prisma.$transaction(async (tx) => {
    const order = await tx.order.update({
      where: { orderNumber: data.orderNumber },
      data: {
        status: data.status,
        paymentStatus: data.paymentStatus,
        shipment: data.courierName || data.consignmentNumber || data.trackingUrl
          ? {
              upsert: {
                update: { courierName: data.courierName, consignmentNumber: data.consignmentNumber, trackingUrl: data.trackingUrl || null },
                create: { courierName: data.courierName, consignmentNumber: data.consignmentNumber, trackingUrl: data.trackingUrl || null }
              }
            }
          : undefined,
        statusHistory: { create: { status: data.status, note: data.note, customerVisible: data.customerVisible, updatedById: actor.id } }
      },
      include: { statusHistory: { orderBy: { createdAt: "asc" } } }
    });
    await tx.auditLog.create({ data: { userId: actor.id, action: "UPDATE_ORDER_STATUS", entity: "Order", entityId: order.id, metadata: { status: data.status, paymentStatus: data.paymentStatus } } });
    return order;
  });
}

export async function cancelOrderAndRestock(orderNumber: string, actor: Actor) {
  assertAdmin(actor);
  return prisma.$transaction(async (tx) => {
    const order = await tx.order.findUnique({ where: { orderNumber }, include: { items: true } });
    if (!order) throw new Error("Order not found.");
    const cancellableStatuses: OrderStatus[] = [OrderStatus.ORDER_PLACED, OrderStatus.AWAITING_PAYMENT, OrderStatus.CONFIRMED, OrderStatus.PROCESSING];
    if (!cancellableStatuses.includes(order.status)) {
      throw new Error("Order cannot be cancelled at this status.");
    }

    for (const item of order.items) {
      if (item.variantId) {
        await tx.productVariant.update({ where: { id: item.variantId }, data: { stockQuantity: { increment: item.quantity } } });
      } else if (item.productId) {
        await tx.product.update({ where: { id: item.productId }, data: { stockQuantity: { increment: item.quantity } } });
      }
      if (item.productId) {
        await tx.inventoryMovement.create({ data: { productId: item.productId, variantId: item.variantId, quantity: item.quantity, reason: "ORDER_CANCELLED", reference: order.orderNumber } });
      }
    }

    return tx.order.update({
      where: { id: order.id },
      data: {
        status: OrderStatus.CANCELLED,
        statusHistory: { create: { status: OrderStatus.CANCELLED, note: "Order cancelled and inventory returned.", updatedById: actor.id, customerVisible: true } }
      }
    });
  });
}
