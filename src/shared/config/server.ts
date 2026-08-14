import "server-only";

/**
 * Secrets. The `server-only` import makes importing this from a client bundle a build
 * error — which is why it is separate from the rest of `shared/config`.
 *
 * Read through functions, so a missing variable fails where it is used and names itself.
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
 * The password to *print on the login page*, or `null` to print nothing. A second
 * variable on purpose: publishing a credential must be an explicit act, so the default —
 * unset — is the safe one. Not validated against the real password, by design.
 */
export function getDemoPasswordHint(): string | null {
  const value = process.env.DEMO_PASSWORD_HINT;

  return typeof value === "string" && value.length > 0 ? value : null;
}
