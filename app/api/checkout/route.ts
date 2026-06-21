import { NextResponse } from "next/server";
import { publicApiErrorMessage } from "@/lib/database-errors";
import { getCurrentUser } from "@/lib/auth";
import { createOrder } from "@/lib/services/order-db";
import { getPaymentProvider } from "@/lib/payments";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const user = await getCurrentUser();
    const order = await createOrder(body, user?.id);
    const provider = getPaymentProvider(body.checkout.paymentMethod);
    const payment = await provider.createPayment({
      orderNumber: order.orderNumber,
      amount: order.total,
      customerPhone: order.customerPhone,
      successUrl: `${process.env.APP_URL}/order/success`,
      failUrl: `${process.env.APP_URL}/checkout?payment=failed`,
      cancelUrl: `${process.env.APP_URL}/checkout?payment=cancelled`
    });
    return NextResponse.json({ orderNumber: order.orderNumber, totals: { total: order.total }, paymentStatus: order.paymentStatus, payment }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: publicApiErrorMessage("Checkout failed.", error, "Checkout failed") }, { status: 400 });
  }
}
