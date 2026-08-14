import { NextResponse, type NextRequest } from "next/server";
import { isValidSessionToken } from "@/features/auth/utils/session-token";
import { SESSION_COOKIE } from "@/features/auth/utils/session-cookie";
import { getAuthSecret } from "@/shared/config/server";

/**
 * Renamed from Middleware in Next.js 16 — the file must be `proxy.ts`, not
 * `middleware.ts`, and it sits beside `app/`.
 *
 * Proxy runs on the **Node.js runtime by default** in Next 16, so it can verify the
 * HMAC rather than merely checking a cookie exists. That distinction is what makes the
 * two-way redirect safe: a presence-only check would bounce an *expired* cookie between
 * /login and /dashboard forever, because Proxy would keep seeing a cookie while the
 * route kept rejecting it.
 *
 * Redirecting here rather than in the pages also produces a real 307. The routes stream,
 * so a `redirect()` inside them commits a 200 first and the navigation happens
 * client-side.
 *
 * The pages still check for themselves. Next's docs are explicit that Proxy is not an
 * authorization layer, and this file is one `matcher` typo away from protecting nothing.
 */
export function proxy(request: NextRequest) {
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  const signedIn = isValidSessionToken(getAuthSecret(), token, Date.now());
  const { pathname } = request.nextUrl;

  /*
   * There is no public page any more — the landing page is gone and the app is login and
   * dashboard. `/` is still the address people type, so it forwards rather than 404s.
   *
   * Unconditionally to /login, not branched on `signedIn`: the rule below already sends a
   * signed-in visitor from /login to /dashboard, and duplicating that decision here would
   * be two places to keep in agreement. A signed-in visitor pays one extra 307 for it.
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
