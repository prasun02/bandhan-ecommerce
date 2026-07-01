import { randomUUID } from "node:crypto";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { publicApiErrorMessage } from "@/lib/database-errors";
import { recordSiteEvent } from "@/lib/events";
import { hasSameOrigin } from "@/lib/security";
import {
  CART_COOKIE,
  getCartSummary,
  removeCartItem,
  upsertCartItem,
  type CartOwner
} from "@/lib/services/cart";

async function owner(createGuest = false): Promise<{ owner?: CartOwner; guestKey?: string; created: boolean }> {
  const user = await getCurrentUser();
  if (user) return { owner: { userId: user.id }, created: false };
  const store = await cookies();
  let guestKey = store.get(CART_COOKIE)?.value;
  const created = !guestKey && createGuest;
  if (created) guestKey = randomUUID();
  return { owner: guestKey ? { guestKey } : undefined, guestKey, created };
}

function withGuestCookie(response: NextResponse, guestKey?: string, created = false) {
  if (guestKey && created) {
    response.cookies.set(CART_COOKIE, guestKey, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 30
    });
  }
  return response;
}

export async function GET() {
  try {
    const resolved = await owner();
    return NextResponse.json(await getCartSummary(resolved.owner));
  } catch (error) {
    return NextResponse.json({ error: publicApiErrorMessage("Cart lookup failed.", error, "Cart lookup failed.") }, { status: 400 });
  }
}

export async function POST(request: Request) {
  if (!hasSameOrigin(request)) return NextResponse.json({ error: "Invalid request origin." }, { status: 403 });
  try {
    const resolved = await owner(true);
    const body = await request.json();
    const cart = await upsertCartItem(body, resolved.owner!);
    const summary = (await import("@/lib/services/cart")).summarizeCart(cart);
    await recordSiteEvent("PRODUCT_ADDED_TO_CART", {
      entityType: "Product",
      entityId: body.productId,
      metadata: { quantity: body.quantity }
    });
    return withGuestCookie(NextResponse.json(summary, { status: 201 }), resolved.guestKey, resolved.created);
  } catch (error) {
    return NextResponse.json({ error: publicApiErrorMessage("Cart update failed.", error, "Cart update failed.") }, { status: 400 });
  }
}

export async function PATCH(request: Request) {
  return POST(request);
}

export async function DELETE(request: Request) {
  if (!hasSameOrigin(request)) return NextResponse.json({ error: "Invalid request origin." }, { status: 403 });
  try {
    const resolved = await owner();
    if (!resolved.owner) return NextResponse.json(await getCartSummary());
    const itemId = new URL(request.url).searchParams.get("itemId");
    if (!itemId) return NextResponse.json({ error: "Cart item is required." }, { status: 400 });
    const summary = await removeCartItem(itemId, resolved.owner);
    await recordSiteEvent("PRODUCT_REMOVED_FROM_CART", { entityType: "CartItem", entityId: itemId });
    return NextResponse.json(summary);
  } catch (error) {
    return NextResponse.json({ error: publicApiErrorMessage("Cart removal failed.", error, "Cart removal failed.") }, { status: 400 });
  }
}
