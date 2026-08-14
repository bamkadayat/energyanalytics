import type { AlignedHours } from "../types";

/**
 * The duration curve, derived on the **server**: 720 hours become 720 numbers, not raw
 * rows for the browser to sort on every render. Pure — no clock, no network. Its sibling
 * is `derive-hour-spread.ts`.
 */

export interface DurationCurve {
  /** Every priced hour, sorted high to low. */
  prices: number[];
  /** Share of hours at or above each price, 0–100, aligned with `prices`. */
  percentiles: number[];
  median: number;
  /*
   * Named by what they mean, not by a percentile index. The array is sorted *descending*,
   * so the value at 10% is the expensive end and the value at 90% is the cheap end —
   * `p10`/`p90` read as exactly the opposite of that to anyone who knows the convention.
   */
  expensiveTenth: number;
  cheapestTenth: number;
  hours: number;
}

/**
 * The price duration curve: every hour sorted most to least expensive. Answers "how many
 * hours were above X?" at a glance, which a chronological chart buries.
 */
export function deriveDurationCurve(aligned: AlignedHours): DurationCurve {
  const prices = aligned.nokPerKwh
    .filter((price): price is number => price !== null && price !== undefined)
    .sort((a, b) => b - a);

  const hours = prices.length;
  if (hours === 0) {
    return {
      prices: [],
      percentiles: [],
      median: 0,
      expensiveTenth: 0,
      cheapestTenth: 0,
      hours: 0,
    };
  }

  const percentiles = prices.map((_, index) => ((index + 1) / hours) * 100);

  return {
    prices,
    percentiles,
    // Sorted descending, so the expensive end sits near the start of the array.
    expensiveTenth: prices[Math.min(hours - 1, Math.floor(hours * 0.1))],
    median: prices[Math.floor(hours * 0.5)],
    cheapestTenth: prices[Math.min(hours - 1, Math.floor(hours * 0.9))],
    hours,
  };
}
