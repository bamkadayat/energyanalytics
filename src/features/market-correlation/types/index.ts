import type { WeatherMetricId } from "@/shared/config";

/**
 * Prices and weather joined on a shared hour, still columnar: `hours[i]`, `nokPerKwh[i]`
 * and `metricValues[i]` describe the same hour, and `null` means absent, never zero.
 *
 * The one dataset every view reads — a second source would let them disagree.
 */
export interface AlignedHours {
  metricId: WeatherMetricId;
  /** Hour starts, ascending, deduplicated. */
  hours: Date[];
  nokPerKwh: ReadonlyArray<number | null>;
  metricValues: ReadonlyArray<number | null>;
  coverage: AlignmentCoverage;
}

/** How well the sources overlapped. Drives partial-data messaging; a one-sided hour is a real gap. */
export interface AlignmentCoverage {
  /** Hours where both a price and a metric reading were present. */
  matchedHours: number;
  /** Hours with a price but no weather reading. */
  priceOnlyHours: number;
  /** Hours with a weather reading but no price. */
  weatherOnlyHours: number;
  /**
   * Repeated hour keys within a single source. Non-zero means the provider sent the
   * same hour twice; the first occurrence wins and this counts the rest.
   */
  duplicateHours: number;
}
