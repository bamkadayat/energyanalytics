import { WEATHER_METRICS, PRICE_UNIT } from "@/shared/config";
import { formatOsloTime } from "@/shared/lib/format-oslo";
import {
  formatMetricValue,
  formatPercentDifference,
  formatPrice,
} from "@/shared/lib/format-number";
import type { AlignedHours } from "../types";
import {
  deriveEveningComparison,
  EVENING_FROM,
  EVENING_UNTIL,
  type DaySummary,
} from "./derive-summary";

/**
 * Three. The one that falls off first — the weather peak — is already its own KPI card,
 * and it still appears when a price observation is missing.
 */
const MAX_INSIGHTS = 3;

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

  const evening = deriveEveningComparison(aligned, summary);
  if (evening !== null) {
    insights.push({
      id: "evening",
      /* Bare hours: "17:00–21:00" wraps in a chip this size. UNTIL is exclusive. */
      hour: `${pad(EVENING_FROM)}–${pad(EVENING_UNTIL - 1)}`,
      text: `Evening hours average ${formatPrice(
        evening.eveningAverage,
      )} ${PRICE_UNIT}${against(evening.eveningAverage, evening.dayAverage)}.`,
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

function pad(hour: number): string {
  return String(hour).padStart(2, "0");
}
