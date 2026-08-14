/**
 * Public API of the market-correlation feature. Owns no provider — it composes the other
 * two into the one aligned dataset every view reads (context/architecture.md §2).
 */
export type { AlignedHours, AlignmentCoverage } from "./types";
export type { SearchParamsInput, ViewMode, ViewParams } from "./utils/view-params";

export { alignPriceAndWeather } from "./utils/align-hours";
export { deriveHourRows } from "./utils/derive-hour-rows";
export type { HourRecord } from "./utils/derive-hour-rows";
export { toChartSeries } from "./utils/to-chart-series";
export { deriveDaySummary, deriveEveningComparison } from "./utils/derive-summary";
export { deriveInsights } from "./utils/derive-insights";
export { deriveDurationCurve } from "./utils/derive-range-views";
export { deriveHourSpread } from "./utils/derive-hour-spread";
export type { HourSpread } from "./utils/derive-hour-spread";
export type { ChartSeries } from "./utils/to-chart-series";
export type { DaySummary, EveningComparison, HourValue } from "./utils/derive-summary";
export type { Insight } from "./utils/derive-insights";
export type { DurationCurve } from "./utils/derive-range-views";
export { CorrelationChart } from "./components/correlation-chart";
export { CorrelationView } from "./components/correlation-view";
export { HoursView } from "./components/hours-view";
export {
  DayViewSkeleton,
  HoursTableSkeleton,
  RangeViewsSkeleton,
} from "./components/skeletons";
export { RangeViews } from "./components/range-views";
export { ViewCard } from "./components/view-card";
export {
  hrefWith,
  parseViewParams,
  viewParamsHref,
  VIEW_PARAM_KEYS,
} from "./utils/view-params";
