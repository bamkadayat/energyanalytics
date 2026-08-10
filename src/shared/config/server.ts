import "server-only";

/**
 * Secrets. Server-only by construction.
 *
 * The `server-only` import makes it a **build error** to pull this module into a client
 * bundle, rather than something review has to catch. Everything else in `shared/config`
 * is safe to import anywhere; this file is not, which is why it is separate.
 *
 * Values are read through functions rather than module-level constants so a missing
 * variable fails where it is used, with a message naming what to set — not at import
 * time with a stack trace pointing at a barrel.
 */

function required(name: string): string {
  const value = process.env[name];

  if (typeof value !== "string" || value.length === 0) {
    throw new Error(
      `Missing required environment variable ${name}. See .env.example; copy it to .env.local and set a value.`,
    );
  }

  return value;
}

/**
 * Key for signing the session cookie. Rotating it invalidates every existing session,
 * which is the intended way to log everyone out.
 */
export function getAuthSecret(): string {
  const secret = required("AUTH_SECRET");

  // A short secret makes the HMAC cheap to brute-force offline. 32 bytes of randomness
  // is the usual floor; refusing at startup beats discovering it in production.
  if (secret.length < 32) {
    throw new Error(
      "AUTH_SECRET must be at least 32 characters. Generate one with: openssl rand -base64 32",
    );
  }

  return secret;
}

/** The single shared password that unlocks the dashboard in this prototype. */
export function getDashboardPassword(): string {
  return required("DASHBOARD_PASSWORD");
}

/**
 * The password to *print on the login page*, or `null` to print nothing.
 *
 * Deliberately a **second variable** rather than reading `DASHBOARD_PASSWORD` directly.
 * Publishing a credential has to be an explicit act: if the login page rendered the real
 * password variable, then anyone deploying this app for something that mattered would
 * publish their password by simply not knowing this feature existed. Here the default —
 * unset — is the safe one, and disclosure requires typing the value a second time.
 *
 * It is not validated against `DASHBOARD_PASSWORD` on purpose. Comparing them would mean
 * holding the real secret next to the printable one to diff it, and a mismatch is a
 * misconfiguration the login form itself will demonstrate immediately.
 */
export function getDemoPasswordHint(): string | null {
  const value = process.env.DEMO_PASSWORD_HINT;

  return typeof value === "string" && value.length > 0 ? value : null;
}
