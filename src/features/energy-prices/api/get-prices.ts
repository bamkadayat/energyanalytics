import { cacheLife } from "next/cache";
import { API_BASE_URL, PRICE_AREA } from "@/shared/config";
import { fetchJson } from "@/shared/lib/fetch-json";
import { pricePathFor, type OsloDay } from "@/shared/lib/oslo-day";
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
export async function getSettledPrices(day: OsloDay): Promise<PriceFetchResult> {
  "use cache";
  cacheLife("hours");

  return toPriceResult(await fetchJson(priceUrl(day)));
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
export async function getPendingPrices(day: OsloDay): Promise<PriceFetchResult> {
  "use cache";
  cacheLife("minutes");

  return toPriceResult(await fetchJson(priceUrl(day)));
}

/**
 * Fetches one day's prices with the lifetime that matches its publication state.
 *
 * Not cached itself — it only routes to one of the two cached functions above. Callers
 * pass `settled` from `areTomorrowPricesExpected`, so the decision stays with the clock
 * rather than being guessed at inside a cached scope.
 */
export function getPrices(day: OsloDay, settled: boolean): Promise<PriceFetchResult> {
  return settled ? getSettledPrices(day) : getPendingPrices(day);
}
