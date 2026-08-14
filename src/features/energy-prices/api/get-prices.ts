import { cacheLife } from "next/cache";
import { API_BASE_URL, CACHE_PROFILE, PRICE_AREA } from "@/shared/config";
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
  cacheLife(CACHE_PROFILE.pricesSettled);

  return withFetchedAt(toPriceResult(await fetchJson(priceUrl(day))));
}

/**
 * Prices for a day that may not be published yet. A separate function, not a branch:
 * `cacheLife` applies to the whole entry and runs before the outcome is known.
 */
export async function getPendingPrices(
  day: OsloDay,
): Promise<Fetched<PriceFetchResult>> {
  "use cache";
  cacheLife(CACHE_PROFILE.pricesPending);

  return withFetchedAt(toPriceResult(await fetchJson(priceUrl(day))));
}

/**
 * Prices across a range of days.
 *
 * One cached call per day rather than one for the range: per-day entries keep yesterday
 * warm when today is refetched, where a range key would evict all 30 as the window slid.
 */
export async function getPriceRange(days: OsloDay[]): Promise<Fetched<PriceFetchResult>[]> {
  return Promise.all(days.map((day) => getSettledPrices(day)));
}

/**
 * Routes to the cached function whose lifetime matches the day's publication state.
 * Callers pass `settled` from `areTomorrowPricesExpected`, keeping that decision with the
 * clock rather than inside a cached scope.
 */
export function getPrices(
  day: OsloDay,
  settled: boolean,
): Promise<Fetched<PriceFetchResult>> {
  return settled ? getSettledPrices(day) : getPendingPrices(day);
}
