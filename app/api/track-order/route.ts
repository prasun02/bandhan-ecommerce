import { NextResponse } from "next/server";
import { publicApiErrorMessage } from "@/lib/database-errors";
import { trackOrder } from "@/lib/services/order-db";

export async function POST(request: Request) {
  try {
    const order = await trackOrder(await request.json());
    return NextResponse.json(order);
  } catch (error) {
    return NextResponse.json({ error: publicApiErrorMessage("Order tracking failed.", error, "Tracking failed.") }, { status: 400 });
  }
}
