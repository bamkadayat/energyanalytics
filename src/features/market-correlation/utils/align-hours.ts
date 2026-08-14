import type { EnergyPrice } from "@/features/energy-prices";
import type { HourlyWeather } from "@/features/weather-forecast";
import type { WeatherMetricId } from "@/shared/config";
import type { AlignedHours } from "../types";

const MS_PER_HOUR = 3_600_000;

/**
 * Joins prices to a weather metric **on a normalized hour, never array index** — the
 * providers drop hours and differ across DST. Returns the union, not the intersection:
 * a one-sided hour is a real gap, and dropping it would hide it behind a shorter chart.
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

/** Floors to the hour. Null for an invalid Date, so one bad timestamp cannot NaN the join. */
function toHourKey(at: Date): number | null {
  const time = at.getTime();
  if (Number.isNaN(time)) {
    return null;
  }
  return Math.floor(time / MS_PER_HOUR) * MS_PER_HOUR;
}
