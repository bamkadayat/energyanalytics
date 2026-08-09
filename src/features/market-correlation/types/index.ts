import type { WeatherMetricId } from "@/shared/config";

/**
 * Prices and weather joined on a shared hour, still columnar.
 *
 * `hours[i]`, `nokPerKwh[i]` and `metricValues[i]` all describe the same hour. A `null`
 * means that source had nothing for that hour — never that the value was zero.
 *
 * This is the single dataset the chart, the summary cards, the insights and the data
 * table all read from. Deriving any of them from a second source would let them
 * disagree.
 */
export interface AlignedHours {
  metricId: WeatherMetricId;
  /** Hour starts, ascending, deduplicated. */
  hours: Date[];
  nokPerKwh: ReadonlyArray<number | null>;
  metricValues: ReadonlyArray<number | null>;
  coverage: AlignmentCoverage;
}

/**
 * How well the two sources actually overlapped. Drives the partial-data messaging in
 * the UI — an hour present in only one source is a real gap the user should see, not
 * something to quietly hide.
 */
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
