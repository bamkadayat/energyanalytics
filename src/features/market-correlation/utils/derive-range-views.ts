import { osloDayOf, osloHourOf } from "@/shared/lib/oslo-day";
import type { AlignedHours } from "../types";

/**
 * Two range-scale views, both derived on the **server** from one aligned dataset.
 *
 * The point of doing it here rather than in the chart components is payload and main
 * thread: 720 hours become ~720 numbers and a handful of scalars, instead of shipping
 * raw rows and sorting or bucketing them in the browser on every render.
 *
 * Both functions are pure and take the data they need — no clock, no network.
 */

export interface PriceHeatmap {
  /** Column labels, one per day, oldest first. */
  dayLabels: string[];
  /** Row labels, `00`–`23`. */
  hourLabels: string[];
  /**
   * `[dayIndex, hourIndex, price]` triples — the shape ECharts' heatmap consumes.
   * Hours with no price are omitted rather than sent as null, which keeps the payload
   * proportional to the data that exists.
   */
  cells: Array<[number, number, number]>;
  min: number;
  max: number;
  /**
   * Hours lost to a DST fall-back, where the wall clock reads the same hour twice and
   * the grid has only one cell for it. Reported rather than hidden — one cell per year
   * shows a single value where two exist.
   */
  collapsedHours: number;
}

const HOUR_LABELS = Array.from({ length: 24 }, (_, hour) =>
  String(hour).padStart(2, "0"),
);

export function derivePriceHeatmap(aligned: AlignedHours): PriceHeatmap {
  const dayKeys: string[] = [];
  const dayIndexByKey = new Map<string, number>();
  const cells: Array<[number, number, number]> = [];
  const seen = new Set<string>();

  let min = Number.POSITIVE_INFINITY;
  let max = Number.NEGATIVE_INFINITY;
  let collapsedHours = 0;

  for (const [index, hour] of aligned.hours.entries()) {
    const price = aligned.nokPerKwh[index];
    if (price === null || price === undefined) {
      continue;
    }

    const day = osloDayOf(hour);
    const key = `${day.year}-${day.month}-${day.day}`;

    let dayIndex = dayIndexByKey.get(key);
    if (dayIndex === undefined) {
      dayIndex = dayKeys.length;
      dayIndexByKey.set(key, dayIndex);
      dayKeys.push(`${day.day}/${day.month}`);
    }

    const hourIndex = osloHourOf(hour);
    const cellKey = `${dayIndex}:${hourIndex}`;
    if (seen.has(cellKey)) {
      // The repeated 02:00 of a fall-back day. The grid has one cell for it.
      collapsedHours += 1;
      continue;
    }
    seen.add(cellKey);

    cells.push([dayIndex, hourIndex, price]);
    min = Math.min(min, price);
    max = Math.max(max, price);
  }

  return {
    dayLabels: dayKeys,
    hourLabels: HOUR_LABELS,
    cells,
    min: Number.isFinite(min) ? min : 0,
    max: Number.isFinite(max) ? max : 0,
    collapsedHours,
  };
}

export interface DurationCurve {
  /** Every priced hour, sorted high to low. */
  prices: number[];
  /** Share of hours at or above each price, 0–100, aligned with `prices`. */
  percentiles: number[];
  median: number;
  p10: number;
  p90: number;
  hours: number;
}

/**
 * The price duration curve: every hour sorted from most to least expensive.
 *
 * Standard in energy analysis because it answers "how many hours were above X?" at a
 * glance — the steepness of the left shoulder is the volatility story, which a
 * chronological chart buries.
 */
export function deriveDurationCurve(aligned: AlignedHours): DurationCurve {
  const prices = aligned.nokPerKwh
    .filter((price): price is number => price !== null && price !== undefined)
    .sort((a, b) => b - a);

  const hours = prices.length;
  if (hours === 0) {
    return { prices: [], percentiles: [], median: 0, p10: 0, p90: 0, hours: 0 };
  }

  const percentiles = prices.map((_, index) => ((index + 1) / hours) * 100);

  return {
    prices,
    percentiles,
    // Sorted descending, so the p10 *price* sits near the start of the array.
    p10: prices[Math.min(hours - 1, Math.floor(hours * 0.1))],
    median: prices[Math.floor(hours * 0.5)],
    p90: prices[Math.min(hours - 1, Math.floor(hours * 0.9))],
    hours,
  };
}
