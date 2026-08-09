import { PRICE_UNIT, WEATHER_METRICS, type WeatherMetricId } from "@/shared/config";
import { formatOsloTime } from "@/shared/lib/format-oslo";
import type { AlignedHours } from "../types";

/**
 * Everything the chart needs, and nothing it does not.
 *
 * Hour labels are **pre-formatted strings**, not timestamps. This is deliberate: an
 * ECharts time axis formats ticks in the *browser's* timezone, so a user in London or
 * New York would see Norwegian market hours relabelled into their own clock while the
 * values stayed put — a wrong chart that looks completely normal. Formatting on the
 * server against Europe/Oslo and using a category axis keeps the hours the same for
 * everyone.
 *
 * `null` means the hour had no reading. It must reach the chart as null so the line
 * breaks there rather than implying a value.
 */
export interface ChartSeries {
  hourLabels: string[];
  prices: ReadonlyArray<number | null>;
  metricValues: ReadonlyArray<number | null>;
  metricId: WeatherMetricId;
  metricLabel: string;
  metricUnit: string;
  priceUnit: string;
}

export function toChartSeries(aligned: AlignedHours): ChartSeries {
  const metric = WEATHER_METRICS[aligned.metricId];

  return {
    hourLabels: aligned.hours.map(formatOsloTime),
    prices: aligned.nokPerKwh,
    metricValues: aligned.metricValues,
    metricId: aligned.metricId,
    metricLabel: metric.label,
    metricUnit: metric.unit,
    priceUnit: PRICE_UNIT,
  };
}
