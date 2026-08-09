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

export async function createSession(now: number = Date.now()): Promise<void> {
  const expiresAt = now + SESSION_DURATION_MS;
  const store = await cookies();

  store.set(SESSION_COOKIE, createSessionToken(getAuthSecret(), expiresAt), {
    // Not readable from JavaScript, so an XSS bug cannot walk off with the session.
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    // `lax` still sends the cookie on top-level navigation into the dashboard, while
    // withholding it from cross-site form posts.
    sameSite: "lax",
    path: "/",
    expires: new Date(expiresAt),
  });
}

export async function destroySession(): Promise<void> {
  const store = await cookies();
  store.delete(SESSION_COOKIE);
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
