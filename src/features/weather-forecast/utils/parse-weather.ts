import { WEATHER_METRICS, WEATHER_METRIC_IDS } from "@/shared/config";
import type { WeatherMetricId } from "@/shared/config";
import type {
  ParsedWeather,
  ParseWeatherResult,
  RawHourlyWeather,
} from "../types";

/**
 * An ISO timestamp stating its offset. Only unambiguous instants are accepted: Open-Meteo's
 * default naive strings would be read in the *server's* zone by `new Date()`, shifting
 * every reading while the chart still looked plausible.
 */
const HAS_EXPLICIT_OFFSET = /(?:Z|[+-]\d{2}:?\d{2})$/;

/**
 * The only place raw Open-Meteo data becomes domain data.
 *
 * Preserves the columnar layout: one `times` array and one parallel array per metric,
 * never expanded into per-hour objects (context/architecture.md §8).
 */
export function parseHourlyWeather(input: unknown): ParseWeatherResult {
  const hourly = extractHourly(input);
  if (hourly === null) {
    return { ok: false, reason: "malformed-payload" };
  }

  if (!Array.isArray(hourly.time)) {
    return { ok: false, reason: "malformed-payload" };
  }

  const rawTimes = hourly.time;

  // Keep the original index alongside the instant: the metric arrays are positional, so
  // discarding an hour has to discard the same position from every parallel array.
  const usableHours: Array<{ index: number; at: Date }> = [];
  for (const [index, value] of rawTimes.entries()) {
    const at = toInstant(value);
    if (at !== null) {
      usableHours.push({ index, at });
    }
  }

  if (usableHours.length === 0) {
    return { ok: false, reason: "no-usable-hours" };
  }

  usableHours.sort((a, b) => a.at.getTime() - b.at.getTime());

  const values = {} as Record<WeatherMetricId, Array<number | null>>;
  const unavailableMetrics: WeatherMetricId[] = [];

  for (const metricId of WEATHER_METRIC_IDS) {
    const column = hourly[WEATHER_METRICS[metricId].variable as keyof RawHourlyWeather];

    /*
     * A length mismatch is not recoverable by truncation. The arrays are positional, so
     * a short or long column means position i no longer refers to hour i — truncating
     * would silently pair readings with the wrong hours. Mark the metric unavailable and
     * fill nulls, which keeps every column exactly times.length long.
     */
    if (!Array.isArray(column) || column.length !== rawTimes.length) {
      unavailableMetrics.push(metricId);
      values[metricId] = new Array<number | null>(usableHours.length).fill(null);
      continue;
    }

    values[metricId] = usableHours.map(({ index }) => toReading(column[index]));
  }

  const data: ParsedWeather = {
    weather: {
      times: usableHours.map(({ at }) => at),
      values,
    },
    unavailableMetrics,
    droppedHours: rawTimes.length - usableHours.length,
  };

  return { ok: true, data };
}

function extractHourly(input: unknown): RawHourlyWeather | null {
  if (typeof input !== "object" || input === null) {
    return null;
  }

  const hourly = (input as { hourly?: unknown }).hourly;
  if (typeof hourly !== "object" || hourly === null || Array.isArray(hourly)) {
    return null;
  }

  return hourly as RawHourlyWeather;
}

/**
 * Epoch **seconds** when numeric — Open-Meteo's `timeformat=unixtime` uses seconds, not
 * milliseconds. See HAS_EXPLICIT_OFFSET for why naive strings are refused.
 */
function toInstant(value: unknown): Date | null {
  if (typeof value === "number" && Number.isFinite(value)) {
    return new Date(value * 1000);
  }

  if (typeof value === "string" && HAS_EXPLICIT_OFFSET.test(value)) {
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }

  return null;
}

/** A gap stays a gap. `null`, `undefined`, `NaN` and strings never become 0. */
function toReading(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}
