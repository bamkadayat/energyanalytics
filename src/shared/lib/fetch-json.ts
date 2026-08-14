import { REQUEST_TIMEOUT_MS } from "@/shared/config";

/**
 * Why a request did not produce usable JSON. `not-found` is separate from
 * `provider-error` on purpose: a 404 from the price API means "not published yet", a
 * normal state with its own UI and cache lifetime.
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
 * A JSON GET with every failure mode returned as a value, never thrown — a slow or dead
 * provider is an operating condition here, and the union forces the caller to handle it.
 *
 * Returns `unknown`; validation belongs to each feature's parser.
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
