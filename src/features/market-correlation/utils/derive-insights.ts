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
 * Two (2026-08-14, on request; was three).
 *
 * The two that show are the cheapest and priciest hour. The weather peak is the one that
 * falls off — it is already its own KPI card — but it stays in the list below, because
 * missing inputs omit an observation rather than hedge it: on a day with no price data it
 * is what fills the space instead of leaving the section empty.
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
 * Factual observations read straight off the displayed data.
 *
 * Every sentence is a **restatement**, never an inference: "the cheapest hour is 03:00"
 * is verifiable from the table, "prices are low because it is windy" is a market claim
 * this app cannot make. No model, no LLM — hence no causal vocabulary anywhere, which a
 * test enforces.
 *
 * Missing inputs omit an observation rather than hedge it. At most `MAX_INSIGHTS`, in
 * the order they are pushed.
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
