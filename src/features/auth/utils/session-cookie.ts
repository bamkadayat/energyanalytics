/**
 * Separate from `api/session.ts` because Proxy needs the name too, and that module pulls
 * in `next/headers`. `__Host-` in production so the browser enforces Secure and path `/`
 * itself; it cannot be set over plain HTTP, so development uses the unprefixed name.
 */
export const SESSION_COOKIE =
  process.env.NODE_ENV === "production" ? "__Host-ea_session" : "ea_session";
