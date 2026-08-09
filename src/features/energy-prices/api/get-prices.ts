import { cacheLife } from "next/cache";
import { API_BASE_URL, PRICE_AREA } from "@/shared/config";
import { fetchJson } from "@/shared/lib/fetch-json";
import { pricePathFor, type OsloDay } from "@/shared/lib/oslo-day";
import { withFetchedAt, type Fetched } from "@/shared/lib/fetched";
import type { PriceFetchResult } from "../types";
import { toPriceResult } from "../utils/to-price-result";

function priceUrl(day: OsloDay): string {
  return `${API_BASE_URL.prices}/${pricePathFor(day)}_${PRICE_AREA.code}.json`;
}

/**
 * Prices for a day whose auction has already cleared.
 *
 * Day-ahead prices are final once published, so a long lifetime is safe.
 */
export async function getSettledPrices(
  day: OsloDay,
): Promise<Fetched<PriceFetchResult>> {
  "use cache";
  cacheLife("hours");

  return withFetchedAt(toPriceResult(await fetchJson(priceUrl(day))));
}

/**
 * Prices for a day that may not have been published yet.
 *
 * Deliberately a *separate* cached function rather than a branch inside the one above.
 * `cacheLife` applies to the whole entry and is called before the outcome is known, so
 * the choice of lifetime has to be made by choosing which function to call.
 *
 * The short lifetime is the point: caching a "not published" miss for hours would hide
 * prices that appear minutes later, and the user would keep seeing "not available yet"
 * long after it stopped being true.
 */
export async function getPendingPrices(
  day: OsloDay,
): Promise<Fetched<PriceFetchResult>> {
  "use cache";
  cacheLife("minutes");

  return withFetchedAt(toPriceResult(await fetchJson(priceUrl(day))));
}

/**
 * Fetches one day's prices with the lifetime that matches its publication state.
 *
 * Not cached itself — it only routes to one of the two cached functions above. Callers
 * pass `settled` from `areTomorrowPricesExpected`, so the decision stays with the clock
 * rather than being guessed at inside a cached scope.
 */
/**
 * Prices across a range of days.
 *
 * One cached call **per day**, in parallel, rather than one call for the range. The
 * provider is per-day anyway, and per-day cache entries mean yesterday stays warm when
 * today is refetched — a range key would evict all 30 days every time the window slid.
 *
 * Failures are dropped rather than propagated: a range view is still useful with 29 of
 * 30 days, and a single provider hiccup should not blank the whole page.
 */
export async function getPriceRange(days: OsloDay[]): Promise<Fetched<PriceFetchResult>[]> {
  return Promise.all(days.map((day) => getSettledPrices(day)));
}

export function getPrices(
  day: OsloDay,
  settled: boolean,
): Promise<Fetched<PriceFetchResult>> {
  return settled ? getSettledPrices(day) : getPendingPrices(day);
}
