import type { EnergyPrice } from "@/features/energy-prices";
import type { HourlyWeather } from "@/features/weather-forecast";
import type { WeatherMetricId } from "@/shared/config";
import type { AlignedHours } from "../types";

const MS_PER_HOUR = 3_600_000;

/**
 * Joins day-ahead prices to an hourly weather metric.
 *
 * **Joins on a normalized hour, never on array index.** The two providers are
 * independent: they can start at different hours, cover different spans, drop hours, or
 * return 23 or 25 of them across a DST transition. Index-joining survives none of that —
 * it would pair 03:00 prices with 02:00 weather and produce a chart that looks entirely
 * reasonable while being wrong. That is the single most dangerous bug available in this
 * project, so the join key is derived from the timestamp itself.
 *
 * Both inputs are absolute instants, and Europe/Oslo's UTC offset is a whole number of
 * hours, so flooring to the hour is zone-independent and needs no conversion. The
 * timezone matters for *labelling* and day selection, not for matching.
 *
 * The result is the union of both sources' hours, not the intersection: an hour only one
 * provider supplied is a real gap the user should be able to see, and silently dropping
 * it would hide missing data behind a shorter chart.
 *
 * Pure — no clock, no network, no React.
 */
export function alignPriceAndWeather(
  prices: readonly EnergyPrice[],
  weather: HourlyWeather | null,
  metricId: WeatherMetricId,
): AlignedHours {
  let duplicateHours = 0;

  const priceByHour = new Map<number, number>();
  for (const price of prices) {
    const key = toHourKey(price.hourStart);
    if (key === null) continue;
    if (priceByHour.has(key)) {
      duplicateHours += 1;
      continue;
    }
    priceByHour.set(key, price.nokPerKwh);
  }

  const metricByHour = new Map<number, number | null>();
  if (weather !== null) {
    const column = weather.values[metricId] ?? [];
    for (const [index, at] of weather.times.entries()) {
      const key = toHourKey(at);
      if (key === null) continue;
      if (metricByHour.has(key)) {
        duplicateHours += 1;
        continue;
      }
      // `undefined` past the end of a short column is a gap, same as an explicit null.
      metricByHour.set(key, column[index] ?? null);
    }
  }

  const hourKeys = [...new Set([...priceByHour.keys(), ...metricByHour.keys()])].sort(
    (a, b) => a - b,
  );

  const hours: Date[] = [];
  const nokPerKwh: Array<number | null> = [];
  const metricValues: Array<number | null> = [];

  let matchedHours = 0;
  let priceOnlyHours = 0;
  let weatherOnlyHours = 0;

  for (const key of hourKeys) {
    const price = priceByHour.has(key) ? (priceByHour.get(key) as number) : null;
    // A present-but-null reading is a gap, which counts differently from an absent hour.
    const metricValue = metricByHour.has(key) ? (metricByHour.get(key) ?? null) : null;

    hours.push(new Date(key));
    nokPerKwh.push(price);
    metricValues.push(metricValue);

    if (price !== null && metricValue !== null) {
      matchedHours += 1;
    } else if (price !== null) {
      priceOnlyHours += 1;
    } else if (metricValue !== null) {
      weatherOnlyHours += 1;
    }
  }

  return {
    metricId,
    hours,
    nokPerKwh,
    metricValues,
    coverage: { matchedHours, priceOnlyHours, weatherOnlyHours, duplicateHours },
  };
}

/**
 * Floors an instant to the start of its hour, as epoch milliseconds.
 *
 * Returns null for an invalid Date so a single bad timestamp cannot poison the join with
 * a NaN key.
 */
function toHourKey(at: Date): number | null {
  const time = at.getTime();
  if (Number.isNaN(time)) {
    return null;
  }
  return Math.floor(time / MS_PER_HOUR) * MS_PER_HOUR;
}
