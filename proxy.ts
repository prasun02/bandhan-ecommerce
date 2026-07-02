import { getToken } from "next-auth/jwt";
import { NextResponse, type NextRequest } from "next/server";
import { AUTH_SESSION_COOKIE_NAME } from "@/lib/auth-cookie";

export async function proxy(request: NextRequest) {
  const path = request.nextUrl.pathname;
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
    cookieName: AUTH_SESSION_COOKIE_NAME
  });

  if (path.startsWith("/admin") && path !== "/admin/login") {
    if (!token || token.active === false) {
      const url = new URL("/admin/login", request.url);
      return NextResponse.redirect(url);
    }
    if (token.role !== "ADMIN") {
      const url = new URL("/admin/login", request.url);
      url.searchParams.set("error", "forbidden");
      return NextResponse.redirect(url);
    }
  }

  if (path.startsWith("/account") && (!token || token.active === false)) {
    const url = new URL("/login", request.url);
    url.searchParams.set("callbackUrl", path);
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/account/:path*"]
};
