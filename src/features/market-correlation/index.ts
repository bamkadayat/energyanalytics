/**
 * Public API of the market-correlation feature.
 *
 * This feature owns no provider. It composes the public contracts of energy-prices and
 * weather-forecast into the single aligned dataset that the chart, summary cards,
 * insights and data table all read (context/architecture.md §2).
 */
export type { AlignedHours, AlignmentCoverage } from "./types";
export type { SearchParamsInput, ViewMode, ViewParams } from "./utils/view-params";

export { alignPriceAndWeather } from "./utils/align-hours";
export { toChartSeries } from "./utils/to-chart-series";
export { summariseMetric, toPreviewChart } from "./utils/to-preview-chart";
export type { MetricPreviewStats, PreviewChart } from "./utils/to-preview-chart";
export { deriveDaySummary, deriveEveningComparison } from "./utils/derive-summary";
export { deriveInsights } from "./utils/derive-insights";
export {
  deriveDurationCurve,
  derivePriceHeatmap,
} from "./utils/derive-range-views";
export type { ChartSeries } from "./utils/to-chart-series";
export type { DaySummary, EveningComparison, HourValue } from "./utils/derive-summary";
export type { Insight } from "./utils/derive-insights";
export type { DurationCurve, PriceHeatmap } from "./utils/derive-range-views";
export { CorrelationChart } from "./components/correlation-chart";
export { CorrelationView } from "./components/correlation-view";
export { RangeViews } from "./components/range-views";
export { ViewCard } from "./components/view-card";
export { ViewControls } from "./components/view-controls";
export {
  hrefWith,
  parseViewParams,
  viewParamsHref,
  VIEW_PARAM_KEYS,
} from "./utils/view-params";
