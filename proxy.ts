import { getToken } from "next-auth/jwt";
import { NextResponse, type NextRequest } from "next/server";

export async function proxy(request: NextRequest) {
  const path = request.nextUrl.pathname;
  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });

  if (path.startsWith("/admin") && path !== "/admin/login") {
    if (!token) {
      const url = new URL("/admin/login", request.url);
      return NextResponse.redirect(url);
    }
    if (token.role !== "ADMIN") {
      const url = new URL("/admin/login", request.url);
      url.searchParams.set("error", "forbidden");
      return NextResponse.redirect(url);
    }
  }

  if (path.startsWith("/account") && !token) {
    const url = new URL("/login", request.url);
    url.searchParams.set("callbackUrl", path);
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/account/:path*"]
};
