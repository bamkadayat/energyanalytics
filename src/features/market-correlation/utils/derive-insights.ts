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
 * How many observations the list shows.
 *
 * Three. A fourth is one more than anyone reads before moving on, and the one that falls
 * off first — the weather peak — is already stated as its own KPI card above the chart.
 * It still appears when a price observation is missing, which is exactly when there is
 * room for it.
 */
const MAX_INSIGHTS = 3;

export interface Insight {
  id: string;
  /**
   * The hour or window this is about, as an Oslo wall-clock label — rendered as a chip
   * beside the sentence rather than buried inside it. Splitting it out is what makes the
   * list scannable: the eye runs down a column of times, not through four sentences that
   * each begin differently. Null when an observation is about the day as a whole.
   */
  hour: string | null;
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
 *
 * At most `MAX_INSIGHTS`, and the order they are pushed in is the priority order.
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
      /*
       * A range rather than a single hour, and bare hours rather than two full clock
       * times: "17:00–21:00" in a chip this size wraps, and both ends are on the hour
       * anyway. EVENING_UNTIL is exclusive, so the label stops an hour short of it.
       */
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

/**
 * The trailing ", 68 % below the daily average" clause — or nothing at all.
 *
 * Returned empty rather than hedged when there is no average to compare against, so the
 * sentence simply ends after the figure instead of trailing off into a caveat.
 */
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
