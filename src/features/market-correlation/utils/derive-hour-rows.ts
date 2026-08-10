import type { EnergyPrice } from "@/features/energy-prices";
import type { HourlyWeather } from "@/features/weather-forecast";
import { WEATHER_METRIC_IDS } from "@/shared/config";

const MS_PER_HOUR = 3_600_000;

/**
 * One hour: the price and all three weather readings.
 *
 * Flat and primitive-only, because these cross the RSC boundary in their thousands — the
 * hour is epoch milliseconds, and the one string is the label the table filters on.
 * Formatting client-side would be thousands of `Intl` calls before the first paint.
 */
export interface HourRecord {
  /** Hour start as epoch milliseconds — sortable as a number, cheap to serialise. */
  at: number;
  /** Pre-formatted Oslo date and hour. What the search box matches against. */
  label: string;
  price: number | null;
  temperature: number | null;
  wind: number | null;
  solar: number | null;
}

/**
 * Joins a long span of prices and weather into one row per hour.
 *
 * The wide sibling of `alignPriceAndWeather`, sharing the rule that matters: **the join
 * key is a normalised hour, never an array index** — the providers cover different spans
 * and a DST day has 23 or 25 hours. The union of both, ascending, so a one-sided hour
 * stays visible.
 *
 * Pure. `formatHour` is injected rather than imported.
 */
export function deriveHourRows(
  prices: readonly EnergyPrice[],
  weather: HourlyWeather | null,
  formatHour: (at: Date) => string,
): HourRecord[] {
  const priceByHour = new Map<number, number>();
  for (const price of prices) {
    const key = toHourKey(price.hourStart);
    if (key === null || priceByHour.has(key)) continue;
    priceByHour.set(key, price.nokPerKwh);
  }

  /** One map per metric, so a metric missing from the payload stays a gap, not a zero. */
  const readings = new Map<number, Partial<Record<string, number | null>>>();
  if (weather !== null) {
    for (const [index, at] of weather.times.entries()) {
      const key = toHourKey(at);
      if (key === null || readings.has(key)) continue;

      const hour: Record<string, number | null> = {};
      for (const id of WEATHER_METRIC_IDS) {
        hour[id] = weather.values[id]?.[index] ?? null;
      }
      readings.set(key, hour);
    }
  }

  const keys = [...new Set([...priceByHour.keys(), ...readings.keys()])].sort(
    (a, b) => a - b,
  );

  return keys.map((key) => {
    const hour = readings.get(key) ?? {};

    return {
      at: key,
      label: formatHour(new Date(key)),
      price: priceByHour.get(key) ?? null,
      temperature: hour.temperature ?? null,
      wind: hour.wind ?? null,
      solar: hour.solar ?? null,
    };
  });
}

/** Floors an instant to its hour. Oslo's offset is whole hours, so this is zone-safe. */
function toHourKey(at: Date): number | null {
  const time = at.getTime();

  return Number.isNaN(time) ? null : Math.floor(time / MS_PER_HOUR) * MS_PER_HOUR;
}
