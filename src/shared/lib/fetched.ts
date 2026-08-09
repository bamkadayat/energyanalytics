/** A provider result, stamped with when it was actually retrieved. */
export type Fetched<T> = T & { fetchedAt: Date };

/**
 * Stamps a result with the current instant.
 *
 * **Call this inside a `use cache` scope, never outside one.** The stamp then records
 * when the cache entry was filled, which is the number the UI needs: with an hours-long
 * lifetime, "now" can be an hour newer than the data it labels, and showing render time
 * as freshness would be a quiet lie.
 *
 * Reading the clock is also the one thing Cache Components permits here — the same
 * `new Date()` in an uncached server component fails the build with
 * `blocking-prerender-current-time` (see context/library-docs.md).
 */
export function withFetchedAt<T extends object>(result: T): Fetched<T> {
  return { ...result, fetchedAt: new Date() };
}
