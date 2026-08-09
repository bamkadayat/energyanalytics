import { REQUEST_TIMEOUT_MS } from "@/shared/config";

/**
 * Why a request did not produce usable JSON.
 *
 * `not-found` is separate from `provider-error` on purpose: the price API answers 404
 * for a day whose prices simply have not been published yet, which is a normal state
 * with its own UI and its own cache lifetime, not a failure.
 */
export type FetchFailureReason =
  | "not-found"
  | "timeout"
  | "network"
  | "provider-error"
  | "invalid-json";

export type FetchJsonOutcome =
  | { ok: true; data: unknown }
  | { ok: false; reason: FetchFailureReason; status?: number };

/**
 * Performs a JSON GET and converts every failure mode into a value.
 *
 * Nothing here throws: a provider being slow, unreachable, or returning HTML is an
 * expected operating condition for this app, not an exception. Returning a union forces
 * the caller to handle each case and keeps a dead provider from becoming a 500.
 *
 * Returns `unknown` rather than a parsed type — validation belongs to each feature's
 * parser, at the boundary.
 */
export async function fetchJson(
  url: string,
  timeoutMs: number = REQUEST_TIMEOUT_MS,
): Promise<FetchJsonOutcome> {
  let response: Response;

  try {
    response = await fetch(url, {
      headers: { accept: "application/json" },
      signal: AbortSignal.timeout(timeoutMs),
    });
  } catch (error) {
    return { ok: false, reason: isTimeout(error) ? "timeout" : "network" };
  }

  if (response.status === 404) {
    return { ok: false, reason: "not-found", status: 404 };
  }

  if (!response.ok) {
    return { ok: false, reason: "provider-error", status: response.status };
  }

  try {
    return { ok: true, data: await response.json() };
  } catch {
    /*
     * A 200 whose body is not JSON. Worth its own reason rather than folding into
     * provider-error: it usually means an error page or a captive portal was served with
     * a success status, which is diagnosed very differently from a 5xx.
     */
    return { ok: false, reason: "invalid-json", status: response.status };
  }
}

/**
 * `AbortSignal.timeout` rejects with a `TimeoutError`, while an externally aborted
 * request rejects with `AbortError`. Both mean "we gave up waiting", and neither should
 * be reported as a network failure.
 */
function isTimeout(error: unknown): boolean {
  return (
    error instanceof Error &&
    (error.name === "TimeoutError" || error.name === "AbortError")
  );
}
