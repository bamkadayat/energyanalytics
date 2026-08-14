import { WEATHER_METRICS, PRICE_UNIT } from "@/shared/config";
import { formatOsloTime } from "@/shared/lib/format-oslo";
import {
  formatMetricValue,
  formatPercentDifference,
  formatPrice,
} from "@/shared/lib/format-number";
import type { AlignedHours } from "../types";
import { type DaySummary } from "./derive-summary";

/**
 * The cheapest and priciest hour. The weather peak is derived below but usually falls off
 * — it has its own KPI card — and only shows on a day with no price data.
 */
const MAX_INSIGHTS = 2;

export interface Insight {
  id: string;
  /**
   * Oslo wall clock, rendered as a chip beside the sentence so the eye can run down a
   * column of times. Null when the observation is about the day as a whole.
   */
  hour: string | null;
  text: string;
}

/**
 * Observations read straight off the displayed data. Every sentence is a restatement,
 * never an inference — "cheapest hour is 03:00" is verifiable, "prices are low because it
 * is windy" is a market claim. A test enforces the absence of causal vocabulary.
 */
export function deriveInsights(
  aligned: AlignedHours,
  summary: DaySummary,
): Insight[] {
  const insights: Insight[] = [];
  const metric = WEATHER_METRICS[aligned.metricId];
  const average = summary.averageNokPerKwh;

  if (summary.cheapestHour !== null) {
    insights.push({
      id: "cheapest",
      hour: formatOsloTime(summary.cheapestHour.at),
      text: `Cheapest hour at ${formatPrice(summary.cheapestHour.value)} ${PRICE_UNIT}${against(
        summary.cheapestHour.value,
        average,
      )}.`,
    });
  }

  if (summary.priciestHour !== null) {
    insights.push({
      id: "priciest",
      hour: formatOsloTime(summary.priciestHour.at),
      text: `Priciest hour at ${formatPrice(summary.priciestHour.value)} ${PRICE_UNIT}${against(
        summary.priciestHour.value,
        average,
      )}.`,
    });
  }

  if (summary.metricPeakHour !== null) {
    insights.push({
      id: "metric-peak",
      hour: formatOsloTime(summary.metricPeakHour.at),
      text: `${metric.label} peaks at ${formatMetricValue(
        summary.metricPeakHour.value,
      )} ${metric.unit}.`,
    });
  }

  return insights.slice(0, MAX_INSIGHTS);
}

/** The ", 68 % below the daily average" clause, or nothing when there is no average. */
function against(value: number, average: number | null): string {
  if (average === null || average === 0) {
    return "";
  }

  const difference = (value - average) / average;
  const direction = difference >= 0 ? "above" : "below";

  return `, ${formatPercentDifference(difference)} ${direction} the daily average`;
}
