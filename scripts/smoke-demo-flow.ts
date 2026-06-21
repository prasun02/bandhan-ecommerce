import "dotenv/config";
import { OrderStatus, PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const connectionString = process.env.DATABASE_URL;
const baseUrl = process.env.APP_URL?.replace(/\/$/, "") ?? "http://127.0.0.1:3000";

if (!connectionString) {
  throw new Error("DATABASE_URL is required for the demo smoke flow.");
}

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString }) });

type CartResponse = {
  id?: string;
  productId?: string;
  variantId?: string | null;
  quantity?: number;
  error?: string;
};

type CheckoutResponse = {
  orderNumber?: string;
  totals?: { total: number };
  paymentStatus?: string;
  error?: string;
};

async function postJson<T>(url: string, body: unknown) {
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  });
  const result = (await response.json()) as T;
  if (!response.ok) {
    throw new Error("error" in (result as object) && typeof (result as { error?: unknown }).error === "string" ? (result as { error: string }).error : `Request failed: ${url}`);
  }
  return result;
}

async function main() {
  const product = await prisma.product.findFirst({
    where: { sku: "BD-CSV-002", status: "PUBLISHED", deletedAt: null },
    include: { variants: { orderBy: { size: "asc" } } }
  });
  if (!product) throw new Error("Imported product BD-CSV-002 was not found.");
  const variant = product.variants.find((item) => item.stockQuantity > 0) ?? product.variants[0];
  if (!variant) throw new Error("Imported product BD-CSV-002 has no variants.");

  const guestKey = `smoke_${crypto.randomUUID()}`;
  const cart = await postJson<CartResponse>(`${baseUrl}/api/cart`, {
    guestKey,
    productId: product.id,
    variantId: variant.id,
    quantity: 1,
    mode: "set"
  });
  if (cart.productId !== product.id || cart.variantId !== variant.id || cart.quantity !== 1) {
    throw new Error("Cart API did not return the imported product variant.");
  }

  const checkout = await postJson<CheckoutResponse>(`${baseUrl}/api/checkout`, {
    guestKey,
    lines: [{ productId: product.id, variantId: variant.id, quantity: 1 }],
    checkout: {
      fullName: "Demo Smoke Customer",
      phone: "01712345678",
      alternativePhone: "",
      email: "smoke@example.com",
      division: "Dhaka",
      district: "Dhaka",
      upazila: "Dhanmondi",
      area: "Dhanmondi",
      street: "Road 1",
      postalCode: "",
      landmark: "",
      deliveryZoneId: "dhaka",
      paymentMethod: "cod",
      couponCode: "WELCOME10",
      termsAccepted: true,
      idempotencyKey: `idem_${crypto.randomUUID()}`
    }
  });
  if (!checkout.orderNumber) throw new Error("Checkout API did not create an order.");

  const order = await prisma.order.findUnique({
    where: { orderNumber: checkout.orderNumber },
    include: { items: true }
  });
  const orderItem = order?.items.find((item) => item.productId === product.id && item.variantId === variant.id);
  if (!order || !orderItem) throw new Error("Created order does not contain the imported product variant.");

  await prisma.$transaction(async (tx) => {
    await tx.productVariant.update({ where: { id: variant.id }, data: { stockQuantity: { increment: orderItem.quantity } } });
    await tx.inventoryMovement.create({
      data: { productId: product.id, variantId: variant.id, quantity: orderItem.quantity, reason: "SMOKE_TEST_RESTOCK", reference: order.orderNumber }
    });
    await tx.order.update({
      where: { id: order.id },
      data: {
        status: OrderStatus.CANCELLED,
        statusHistory: {
          create: { status: OrderStatus.CANCELLED, note: "Smoke test order cancelled and stock restored.", customerVisible: false }
        }
      }
    });
    await tx.cart.deleteMany({ where: { guestKey } });
  });

  console.log(JSON.stringify({
    productSku: product.sku,
    variantSku: variant.sku,
    cartItemId: cart.id,
    orderNumber: order.orderNumber,
    paymentStatus: checkout.paymentStatus,
    total: checkout.totals?.total,
    restored: true
  }, null, 2));
}

main()
  .catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : "Demo smoke flow failed.");
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
