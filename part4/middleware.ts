import { NextRequest, NextResponse } from "next/server";

export function middleware(request: NextRequest) {
  const token = request.cookies.get("token")?.value;
  const { pathname } = request.nextUrl;

  if (pathname.startsWith("/places") && pathname.endsWith("/review") && !token) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  if (pathname.startsWith("/places") && !token) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (pathname.startsWith("/admin") && !token) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (pathname.startsWith("/login") && token) {
    return NextResponse.redirect(new URL("/places", request.url));
  }

  if (pathname.startsWith("/register") && token) {
    return NextResponse.redirect(new URL("/places", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/places/:path*", "/admin/:path*", "/login", "/register"],
};
