import type { FetchJsonOutcome } from "@/shared/lib/fetch-json";
import type { PriceFetchResult } from "../types";
import { parseEnergyPrices } from "./parse-prices";

/**
 * Transport outcome to domain result. Pure and separate from the fetcher, so every branch
 * tests without a network. The mapping that matters: a 404 becomes `not-published`, never
 * an error — before the auction clears, that is the correct state of the world.
 */
export function toPriceResult(outcome: FetchJsonOutcome): PriceFetchResult {
  if (!outcome.ok) {
    if (outcome.reason === "not-found") {
      return { status: "not-published" };
    }
    return { status: "error", reason: outcome.reason };
  }

  const parsed = parseEnergyPrices(outcome.data);
  if (!parsed.ok) {
    return { status: "error", reason: "malformed-payload" };
  }

  /*
   * An empty-but-valid array means the same thing as a 404 here: the provider has
   * acknowledged the day and has nothing for it yet. Reporting "ok with zero prices"
   * would leave the UI to render an empty chart with no explanation.
   */
  if (parsed.data.prices.length === 0) {
    return { status: "not-published" };
  }

  return {
    status: "ok",
    prices: parsed.data.prices,
    droppedEntries: parsed.data.droppedEntries,
  };
}
