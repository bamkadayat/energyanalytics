import "server-only";

import { cookies } from "next/headers";
import { connection } from "next/server";
import { getAuthSecret } from "@/shared/config/server";
import { SESSION_COOKIE } from "../utils/session-cookie";
import {
  createSessionToken,
  isValidSessionToken,
  SESSION_DURATION_MS,
} from "../utils/session-token";

export { SESSION_COOKIE } from "../utils/session-cookie";

/**
 * The cookie's attributes, defined once and used by **both** writes.
 *
 * They have to match exactly. A browser identifies a cookie by name, domain and path, so
 * a removal that does not carry the same attributes is not recognised as removing
 * anything — and for a `__Host-` prefixed name the rules are stricter still: the browser
 * rejects *any* `Set-Cookie` for it that lacks `Secure` or sets a path other than `/`.
 *
 * That is not hypothetical. This module used `cookies().delete(name)` to log out, which
 * emits `Set-Cookie: __Host-ea_session=; Path=/; Expires=<epoch>` — no `Secure`. In
 * production the browser refused it, the session cookie survived, and logging out did
 * nothing. Development was unaffected, because the name is unprefixed there.
 */
const SESSION_COOKIE_OPTIONS = {
  // Not readable from JavaScript, so an XSS bug cannot walk off with the session.
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  // `lax` still sends the cookie on top-level navigation into the dashboard, while
  // withholding it from cross-site form posts.
  sameSite: "lax",
  path: "/",
} as const;

export async function createSession(now: number = Date.now()): Promise<void> {
  const expiresAt = now + SESSION_DURATION_MS;
  const store = await cookies();

  store.set(SESSION_COOKIE, createSessionToken(getAuthSecret(), expiresAt), {
    ...SESSION_COOKIE_OPTIONS,
    expires: new Date(expiresAt),
  });
}

/**
 * Clears the session by overwriting it with an already-expired cookie carrying the same
 * attributes — not by `delete()`, for the reason above.
 */
export async function destroySession(): Promise<void> {
  const store = await cookies();

  store.set(SESSION_COOKIE, "", {
    ...SESSION_COOKIE_OPTIONS,
    expires: new Date(0),
    maxAge: 0,
  });
}

/**
 * The authoritative check.
 *
 * Next's docs are explicit that Proxy must not be treated as a session-management or
 * authorization layer — it runs before the request completes and is meant for optimistic
 * redirects. Anything actually protecting data has to verify here, in the route.
 */
export async function hasValidSession(nowOverride?: number): Promise<boolean> {
  /*
   * `connection()` before reading the clock. Under Cache Components a bare `Date.now()`
   * fails the prerender with `blocking-prerender-current-time`, and `instant = false`
   * explicitly does *not* clear synchronous-IO errors — only `connection()`, `use cache`
   * or a client component do. This is correct for a protected route anyway: there is
   * nothing here worth prerendering.
   */
  if (nowOverride === undefined) {
    await connection();
  }

  const now = nowOverride ?? Date.now();
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;

  return isValidSessionToken(getAuthSecret(), token, now);
}
