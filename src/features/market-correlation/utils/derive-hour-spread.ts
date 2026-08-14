import { osloHourOf } from "@/shared/lib/oslo-day";
import type { AlignedHours } from "../types";

/**
 * What every hour cost across the range: `[min, Q1, median, Q3, max]` per hour.
 *
 * Quartiles are nearest-rank, never interpolated — these are observed prices, and an
 * averaged quartile is a price that never happened.
 */
export interface HourSpread {
  /** `00`–`23`, Europe/Oslo wall clock. */
  hourLabels: string[];
  /** ECharts boxplot order. `null` where the range priced no such hour — a gap. */
  boxes: Array<number[] | null>;
  /** How many days contributed to each hour, so a thin box is visibly thin evidence. */
  counts: number[];
  /** Extremes across every hour, for the axis. */
  min: number;
  max: number;
  /** Hours of the day with no priced hour anywhere in the range. */
  emptyHours: number;
}

const HOUR_LABELS = Array.from({ length: 24 }, (_, hour) =>
  String(hour).padStart(2, "0"),
);

export function deriveHourSpread(aligned: AlignedHours): HourSpread {
  const byHour: number[][] = Array.from({ length: 24 }, () => []);

  for (const [index, at] of aligned.hours.entries()) {
    const price = aligned.nokPerKwh[index];
    if (price === null || price === undefined) {
      continue;
    }

    byHour[osloHourOf(at)].push(price);
  }

  const boxes: Array<number[] | null> = [];
  const counts: number[] = [];
  let min = Number.POSITIVE_INFINITY;
  let max = Number.NEGATIVE_INFINITY;
  let emptyHours = 0;

  for (const prices of byHour) {
    counts.push(prices.length);

    if (prices.length === 0) {
      boxes.push(null);
      emptyHours += 1;
      continue;
    }

    const sorted = [...prices].sort((a, b) => a - b);
    const box = [
      sorted[0],
      quantile(sorted, 0.25),
      quantile(sorted, 0.5),
      quantile(sorted, 0.75),
      sorted[sorted.length - 1],
    ];

    boxes.push(box);
    min = Math.min(min, box[0]);
    max = Math.max(max, box[4]);
  }

  return {
    hourLabels: HOUR_LABELS,
    boxes,
    counts,
    min: Number.isFinite(min) ? min : 0,
    max: Number.isFinite(max) ? max : 0,
    emptyHours,
  };
}

/** Nearest-rank quantile. One observation has no spread, so every quantile is it. */
function quantile(sorted: number[], fraction: number): number {
  const rank = Math.ceil(fraction * sorted.length) - 1;

  return sorted[Math.min(sorted.length - 1, Math.max(0, rank))];
}
