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
 * Used by both writes, and they must match exactly. A `__Host-` cookie is rejected by the
 * browser unless every `Set-Cookie` for it carries `Secure` and `Path=/` — which is why
 * logout overwrites rather than calling `delete()`, whose output omits `Secure`.
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

/** Overwrites with an expired cookie carrying the same attributes — see above. */
export async function destroySession(): Promise<void> {
  const store = await cookies();

  store.set(SESSION_COOKIE, "", {
    ...SESSION_COOKIE_OPTIONS,
    expires: new Date(0),
    maxAge: 0,
  });
}

/** The authoritative check. Proxy only does optimistic redirects; routes verify here. */
export async function hasValidSession(nowOverride?: number): Promise<boolean> {
  /*
   * Under Cache Components a bare `Date.now()` fails the prerender, and `instant = false`
   * does not clear synchronous-IO errors — only `connection()` does.
   */
  if (nowOverride === undefined) {
    await connection();
  }

  const now = nowOverride ?? Date.now();
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;

  return isValidSessionToken(getAuthSecret(), token, now);
}
