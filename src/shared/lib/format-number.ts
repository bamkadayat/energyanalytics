import { APP_LOCALE } from "@/shared/config";

/**
 * Number formatting for display.
 *
 * Units are never folded in — the caller places them, so a figure cannot be rendered
 * without one. Every formatter shares `APP_LOCALE`: grouping thousands one way and
 * decimals another on the same page is what makes numbers unreadable.
 */

/** Three decimals: spot prices sit near 1 NOK/kWh but individual hours fall below 0.01. */
const priceFormatter = new Intl.NumberFormat(APP_LOCALE, {
  minimumFractionDigits: 2,
  maximumFractionDigits: 3,
});

const metricFormatter = new Intl.NumberFormat(APP_LOCALE, {
  maximumFractionDigits: 1,
});

const percentFormatter = new Intl.NumberFormat(APP_LOCALE, {
  maximumFractionDigits: 0,
});

/** Whole counts — hours, days, rows. Grouped. */
const countFormatter = new Intl.NumberFormat(APP_LOCALE, {
  maximumFractionDigits: 0,
});

export function formatCount(value: number): string {
  return countFormatter.format(value);
}

/** Renders a missing value as an em dash rather than as a number. */
export const MISSING_VALUE = "—";

export function formatPrice(nokPerKwh: number | null | undefined): string {
  return typeof nokPerKwh === "number" && Number.isFinite(nokPerKwh)
    ? priceFormatter.format(nokPerKwh)
    : MISSING_VALUE;
}

export function formatMetricValue(value: number | null | undefined): string {
  return typeof value === "number" && Number.isFinite(value)
    ? metricFormatter.format(value)
    : MISSING_VALUE;
}

/** Whole-percent difference, unsigned — the caller says "higher" or "lower". */
export function formatPercentDifference(ratio: number): string {
  return `${percentFormatter.format(Math.abs(ratio) * 100)} %`;
}
