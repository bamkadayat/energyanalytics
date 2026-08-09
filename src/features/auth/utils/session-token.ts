import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * A signed, self-contained session token: `<expiresAt>.<signature>`.
 *
 * There is no session store. The token carries its own expiry and an HMAC over that
 * expiry, so the server can validate it with nothing but the secret. For a prototype
 * with one shared password and no per-user state, a database would be storing nothing.
 *
 * The payload is deliberately *only* an expiry. It carries no identity, no role and no
 * user input, so there is nothing in it worth tampering with beyond extending the
 * lifetime — which the signature prevents.
 *
 * Pure and secret-injected, so the whole scheme is testable without env or cookies.
 */

const SEPARATOR = ".";

/** Eight hours: long enough to demo, short enough that a leaked cookie expires. */
export const SESSION_DURATION_MS = 8 * 60 * 60 * 1000;

export function createSessionToken(
  secret: string,
  expiresAt: number,
): string {
  return `${expiresAt}${SEPARATOR}${sign(secret, String(expiresAt))}`;
}

/**
 * Verifies signature *and* expiry.
 *
 * Returns a boolean rather than throwing: an invalid cookie is an ordinary condition —
 * expired sessions, rotated secrets, stale tampering — not an exceptional one.
 */
export function isValidSessionToken(
  secret: string,
  token: string | undefined,
  now: number,
): boolean {
  if (typeof token !== "string") {
    return false;
  }

  const separatorAt = token.indexOf(SEPARATOR);
  if (separatorAt <= 0) {
    return false;
  }

  const expiresAtRaw = token.slice(0, separatorAt);
  const signature = token.slice(separatorAt + 1);

  // Reject anything that is not a plain positive integer before doing crypto work.
  if (!/^\d+$/.test(expiresAtRaw)) {
    return false;
  }

  const expiresAt = Number(expiresAtRaw);
  if (!Number.isSafeInteger(expiresAt) || expiresAt <= now) {
    return false;
  }

  return safeEquals(signature, sign(secret, expiresAtRaw));
}

function sign(secret: string, payload: string): string {
  return createHmac("sha256", secret).update(payload).digest("base64url");
}

/**
 * Constant-time comparison. A plain `===` leaks how many leading characters matched
 * through its timing, which is enough to forge a signature one byte at a time.
 *
 * Lengths are compared first because `timingSafeEqual` throws on a mismatch — that check
 * reveals only the length, which the format already makes public.
 */
function safeEquals(a: string, b: string): boolean {
  const left = Buffer.from(a, "utf8");
  const right = Buffer.from(b, "utf8");

  if (left.length !== right.length) {
    return false;
  }

  return timingSafeEqual(left, right);
}

/**
 * Compares a submitted password against the expected one in constant time.
 *
 * Same reasoning as the signature check: `===` on a secret is a timing oracle.
 */
export function isCorrectPassword(expected: string, submitted: unknown): boolean {
  if (typeof submitted !== "string") {
    return false;
  }

  return safeEquals(hashForCompare(submitted), hashForCompare(expected));
}

/**
 * Hashing before comparison equalises the buffer lengths, so a wrong-length password
 * cannot be distinguished from a wrong-content one.
 */
function hashForCompare(value: string): string {
  return createHmac("sha256", "password-compare").update(value).digest("base64url");
}
