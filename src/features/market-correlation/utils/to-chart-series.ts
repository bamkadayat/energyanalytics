import { PRICE_UNIT, WEATHER_METRICS, type WeatherMetricId } from "@/shared/config";
import { formatOsloTime } from "@/shared/lib/format-oslo";
import type { AlignedHours } from "../types";

/**
 * Hour labels are pre-formatted strings, not timestamps: an ECharts time axis would
 * relabel Norwegian market hours into the browser's zone while the values stayed put.
 *
 * `null` must reach the chart as null, so the line breaks rather than implying a value.
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
