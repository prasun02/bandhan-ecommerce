import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { recordSiteEvent } from "@/lib/events";
import { hasSameOrigin } from "@/lib/security";
import { CART_COOKIE, mergeGuestCart } from "@/lib/services/cart";

export async function POST(request: Request) {
  if (!hasSameOrigin(request)) return NextResponse.json({ error: "Invalid request origin." }, { status: 403 });
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  const store = await cookies();
  const guestKey = store.get(CART_COOKIE)?.value;
  const summary = await mergeGuestCart(user.id, guestKey);
  const response = NextResponse.json(summary);
  if (guestKey) response.cookies.delete(CART_COOKIE);
  await recordSiteEvent("GUEST_CART_MERGED", { userId: user.id });
  return response;
}
