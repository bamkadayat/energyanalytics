/**
 * Public API of the market-correlation feature.
 *
 * This feature owns no provider. It composes the public contracts of energy-prices and
 * weather-forecast into the single aligned dataset that the chart, summary cards,
 * insights and data table all read (context/architecture.md §2).
 */
export type { AlignedHours, AlignmentCoverage } from "./types";

export { alignPriceAndWeather } from "./utils/align-hours";
