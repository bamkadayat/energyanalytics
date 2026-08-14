/** A provider result, stamped with when it was actually retrieved. */
export type Fetched<T> = T & { fetchedAt: Date };

/**
 * Stamps a result with the current instant. **Call inside a `use cache` scope, never
 * outside one** — the stamp must record when the entry was filled, not render time,
 * which with an hours-long lifetime would be a quiet lie about freshness.
 */
export function withFetchedAt<T extends object>(result: T): Fetched<T> {
  return { ...result, fetchedAt: new Date() };
}
