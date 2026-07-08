import { NextRequest, NextResponse } from "next/server";
import { getIronSession } from "iron-session";

const sessionOptions = {
  get password() {
    const pw = process.env.IRON_SESSION_PASSWORD;
    if (!pw || pw.length < 32) throw new Error("IRON_SESSION_PASSWORD invalid");
    return pw;
  },
  cookieName: "event-mj-session",
  cookieOptions: {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  },
};

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Admin routes require validated session
  if (pathname.startsWith("/admin")) {
    const sessionCookie = request.cookies.get("event-mj-session");
    if (!sessionCookie) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("redirect", pathname);
      return NextResponse.redirect(loginUrl);
    }

    // Validate session integrity (not just cookie presence)
    try {
      const cookieStore = request.cookies;
      const session = await getIronSession<{ isLoggedIn?: boolean }>(cookieStore as never, sessionOptions);
      if (!session.isLoggedIn) {
        const loginUrl = new URL("/login", request.url);
        loginUrl.searchParams.set("redirect", pathname);
        return NextResponse.redirect(loginUrl);
      }
    } catch {
      const loginUrl = new URL("/login", request.url);
      return NextResponse.redirect(loginUrl);
    }
  }

  // API routes: add security headers, let route handlers do auth
  if (pathname.startsWith("/api/")) {
    const response = NextResponse.next();
    response.headers.set("X-Content-Type-Options", "nosniff");
    response.headers.set("X-Frame-Options", "DENY");
    return response;
  }

  // Member routes: validate member session
  if (pathname.startsWith("/member")) {
    const memberCookie = request.cookies.get("member-session");
    if (!memberCookie) {
      return NextResponse.redirect(new URL("/login/member", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/admin/:path*",
    "/api/:path*",
    "/member/:path*",
  ],
};
