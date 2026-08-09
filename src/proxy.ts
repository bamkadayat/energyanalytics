import { NextResponse, type NextRequest } from "next/server";

/**
 * Renamed from Middleware in Next.js 16 — the file must be `proxy.ts`, not
 * `middleware.ts`, and it lives beside `app/`.
 *
 * **This is an optimistic check only.** Next's own docs state Proxy is not a session
 * management or authorization solution: it runs before the request completes and cannot
 * be the thing that protects data. It exists here purely so a signed-out visitor is
 * redirected without paying for a render.
 *
 * The authoritative check is `hasValidSession()` inside the dashboard route, which
 * actually verifies the signature and expiry. Deleting this file would cost a redirect;
 * deleting that one would expose the data.
 */
const SESSION_COOKIES = ["__Host-ea_session", "ea_session"];

export function proxy(request: NextRequest) {
  const hasSessionCookie = SESSION_COOKIES.some(
    (name) => request.cookies.get(name)?.value,
  );

  if (hasSessionCookie) {
    return NextResponse.next();
  }

  const loginUrl = new URL("/login", request.url);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: ["/dashboard/:path*"],
};
