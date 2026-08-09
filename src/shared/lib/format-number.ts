import { APP_LOCALE } from "@/shared/config";

/**
 * Number formatting for display.
 *
 * Values are formatted for the locale but **units are never folded in** — the caller
 * places the unit, so a number can never end up rendered without one. This app carries
 * three different units across two axes, and a bare figure is a domain bug waiting to
 * happen.
 *
 * Formatters are built once; they are called per hour in the table.
 */

/**
 * Three decimals: Norwegian spot prices sit near 1 NOK/kWh but individual hours can fall
 * below 0.01, and rounding those to two decimals would render several distinct hours as
 * an identical "0,01".
 */
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
