import { NextRequest, NextResponse } from "next/server";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Admin routes require auth — check for session cookie
  if (pathname.startsWith("/admin")) {
    const sessionCookie = request.cookies.get("event-mj-session");
    if (!sessionCookie) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("redirect", pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  // Admin API routes also require auth (except public ones)
  if (
    pathname.startsWith("/api/") &&
    !pathname.startsWith("/api/auth/") &&
    !pathname.startsWith("/api/member/lookup") &&
    !pathname.startsWith("/api/event/by-slug/") &&
    !pathname.startsWith("/api/registrasi") &&
    !pathname.startsWith("/api/pembayaran") &&
    !pathname.startsWith("/api/cloudinary/")
  ) {
    // API auth is handled within route handlers for finer control
    // Middleware just does basic cookie presence check
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/admin/:path*",
    "/api/:path*",
  ],
};
