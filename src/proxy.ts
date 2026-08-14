import { NextResponse, type NextRequest } from "next/server";
import { isValidSessionToken } from "@/features/auth/utils/session-token";
import { SESSION_COOKIE } from "@/features/auth/utils/session-cookie";
import { getAuthSecret } from "@/shared/config/server";

/**
 * Middleware, renamed to Proxy in Next 16. Verifies the HMAC rather than the cookie's
 * presence — a presence check would bounce an expired cookie between the two routes
 * forever. Not an authorization layer: the pages still check for themselves.
 */
export function proxy(request: NextRequest) {
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  const signedIn = isValidSessionToken(getAuthSecret(), token, Date.now());
  const { pathname } = request.nextUrl;

  /*
   * No public page exists, but `/` is still what people type. Unconditional rather than
   * branched on `signedIn` — the rule below already forwards /login to /dashboard, and
   * duplicating it here would be two places to keep in agreement.
   */
  if (pathname === "/") {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // Signed in, but sitting on the login form: its only outcome is where they already
  // have access to.
  if (signedIn && pathname === "/login") {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  if (!signedIn && pathname.startsWith("/dashboard")) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/", "/dashboard/:path*", "/login"],
};
