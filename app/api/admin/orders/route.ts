import { NextResponse } from "next/server";
import { publicApiErrorMessage } from "@/lib/database-errors";
import { requireAdmin } from "@/lib/auth";
import { updateOrderStatus } from "@/lib/services/order-db";

export async function PATCH(request: Request) {
  try {
    const actor = await requireAdmin();
    const order = await updateOrderStatus(await request.json(), actor);
    return NextResponse.json(order);
  } catch (error) {
    return NextResponse.json({ error: publicApiErrorMessage("Order update failed.", error, "Order update failed.") }, { status: 400 });
  }
}
