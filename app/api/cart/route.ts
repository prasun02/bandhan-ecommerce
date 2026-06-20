import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getCart, upsertCartItem } from "@/lib/services/cart";

export async function GET(request: Request) {
  try {
    const user = await getCurrentUser();
    const guestKey = new URL(request.url).searchParams.get("guestKey") ?? undefined;
    const cart = await getCart(user?.id ? { userId: user.id } : { guestKey });
    return NextResponse.json(cart ?? { items: [] });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Cart lookup failed." }, { status: 400 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    const body = await request.json();
    const item = await upsertCartItem(body, user?.id ? { userId: user.id } : { guestKey: body.guestKey });
    return NextResponse.json(item, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Cart update failed." }, { status: 400 });
  }
}
