import { NextResponse } from "next/server";
import { trackOrder } from "@/lib/services/order-db";

export async function POST(request: Request) {
  try {
    const order = await trackOrder(await request.json());
    return NextResponse.json(order);
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Tracking failed." }, { status: 400 });
  }
}
