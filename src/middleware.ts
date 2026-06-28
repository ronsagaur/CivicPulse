import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const session = request.cookies.get("civicpulse_session");
  const { pathname } = request.nextUrl;

  // Allow access to login, api, static files, images, etc.
  if (
    pathname.startsWith("/login") ||
    pathname.startsWith("/api") ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/assets") ||
    pathname === "/favicon.ico"
  ) {
    return NextResponse.next();
  }

  // If no session, redirect to login
  if (!session) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // Basic role routing enforcement
  if (pathname.startsWith("/authority") && session.value !== "AUTHORITY_SESSION") {
    // If a citizen tries to access authority portal, redirect to citizen home
    return NextResponse.redirect(new URL("/", request.url));
  }

  if (pathname === "/" && session.value === "AUTHORITY_SESSION") {
    // If an authority goes to root, redirect to authority portal
    return NextResponse.redirect(new URL("/authority", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|assets).*)"],
};
