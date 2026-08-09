/**
 * The session cookie's name, in one place.
 *
 * Kept out of `api/session.ts` because Proxy needs it too, and that module imports
 * `next/headers` — pulling it into Proxy would drag request-scoped APIs somewhere they
 * do not belong.
 *
 * `__Host-` in production so the browser enforces its own rules on top of ours: it
 * requires Secure, path `/`, and no Domain, and refuses the cookie otherwise. It cannot
 * be set over plain HTTP, so development falls back to the unprefixed name.
 */
export const SESSION_COOKIE =
  process.env.NODE_ENV === "production" ? "__Host-ea_session" : "ea_session";
