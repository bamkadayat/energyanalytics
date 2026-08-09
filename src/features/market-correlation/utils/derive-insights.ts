import { WEATHER_METRICS, PRICE_UNIT } from "@/shared/config";
import { formatOsloTime } from "@/shared/lib/format-oslo";
import {
  formatMetricValue,
  formatPercentDifference,
  formatPrice,
} from "@/shared/lib/format-number";
import type { AlignedHours } from "../types";
import { deriveEveningComparison, type DaySummary } from "./derive-summary";

export interface Insight {
  id: string;
  text: string;
}

/**
 * Factual observations read straight off the displayed data.
 *
 * Every sentence is a **restatement**, never an inference. "The cheapest hour is 03:00"
 * is something the reader could verify from the table; "prices are low because it is
 * windy" is a market claim this app has no basis for and must never make. There is no
 * model here and no LLM — just the numbers, said out loud.
 *
 * That constraint is also why the wording avoids "because", "driven by" and "due to"
 * entirely, and why the evening observation says the evening *is* higher rather than
 * that anything made it so.
 *
 * An observation is omitted rather than hedged when its inputs are missing: a list of
 * three true statements is better than four where one says "unknown".
 */
export function deriveInsights(
  aligned: AlignedHours,
  summary: DaySummary,
): Insight[] {
  const insights: Insight[] = [];
  const metric = WEATHER_METRICS[aligned.metricId];

  if (summary.cheapestHour !== null) {
    insights.push({
      id: "cheapest",
      text: `Cheapest hour is ${formatOsloTime(summary.cheapestHour.at)} at ${formatPrice(
        summary.cheapestHour.value,
      )} ${PRICE_UNIT}.`,
    });
  }

  if (summary.priciestHour !== null) {
    insights.push({
      id: "priciest",
      text: `Most expensive hour is ${formatOsloTime(
        summary.priciestHour.at,
      )} at ${formatPrice(summary.priciestHour.value)} ${PRICE_UNIT}.`,
    });
  }

  const evening = deriveEveningComparison(aligned, summary);
  if (evening !== null) {
    const direction = evening.difference >= 0 ? "above" : "below";
    insights.push({
      id: "evening",
      text: `Evening hours (17:00–21:00) average ${formatPrice(
        evening.eveningAverage,
      )} ${PRICE_UNIT}, ${formatPercentDifference(
        evening.difference,
      )} ${direction} the daily average.`,
    });
  }

  if (summary.metricPeakHour !== null) {
    insights.push({
      id: "metric-peak",
      text: `${metric.label} peaks at ${formatOsloTime(
        summary.metricPeakHour.at,
      )} at ${formatMetricValue(summary.metricPeakHour.value)} ${metric.unit}.`,
    });
  }

  return insights;
}
