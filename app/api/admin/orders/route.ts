import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { updateOrderStatus } from "@/lib/services/order-db";

export async function PATCH(request: Request) {
  try {
    const actor = await requireAdmin();
    const order = await updateOrderStatus(await request.json(), actor);
    return NextResponse.json(order);
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Order update failed." }, { status: 400 });
  }
}
