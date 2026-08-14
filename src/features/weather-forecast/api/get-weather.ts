import { cacheLife } from "next/cache";
import {
  API_BASE_URL,
  CACHE_PROFILE,
  WEATHER_LOCATION,
  WEATHER_METRICS,
  WEATHER_METRIC_IDS,
  WEATHER_REQUEST_PARAMS,
} from "@/shared/config";
import { fetchJson } from "@/shared/lib/fetch-json";
import { isoDateFor, type OsloDay } from "@/shared/lib/oslo-day";
import { withFetchedAt, type Fetched } from "@/shared/lib/fetched";
import type { WeatherFetchResult } from "../types";
import { toWeatherResult } from "../utils/to-weather-result";

/**
 * Requests only the three hourly variables the interface renders — asking for more would
 * inflate the payload for data nothing displays.
 *
 * `start_date`/`end_date` are the same Oslo calendar day, which returns exactly that
 * day's hours (23, 24 or 25 depending on DST) rather than a rolling window.
 */
function weatherUrl(from: OsloDay, to: OsloDay = from): string {
  const params = new URLSearchParams({
    latitude: String(WEATHER_LOCATION.latitude),
    longitude: String(WEATHER_LOCATION.longitude),
    hourly: WEATHER_METRIC_IDS.map((id) => WEATHER_METRICS[id].variable).join(","),
    start_date: isoDateFor(from),
    end_date: isoDateFor(to),
    ...WEATHER_REQUEST_PARAMS,
  });

  return `${API_BASE_URL.weather}?${params.toString()}`;
}

/**
 * One Oslo day of hourly weather for the representative location.
 *
 * Cached for hours: Open-Meteo republishes on a slow cadence, so a shorter lifetime
 * would spend requests without producing fresher data.
 */
export async function getWeather(
  day: OsloDay,
): Promise<Fetched<WeatherFetchResult>> {
  "use cache";
  cacheLife(CACHE_PROFILE.weather);

  return withFetchedAt(toWeatherResult(await fetchJson(weatherUrl(day))));
}

/**
 * A whole range in **one** request.
 *
 * Open-Meteo serves an arbitrary date span from a single URL, so 30 days costs one round
 * trip rather than 30. That asymmetry with the price provider — per-day there, per-range
 * here — is why the two fetchers do not share a shape.
 */
export async function getWeatherRange(
  from: OsloDay,
  to: OsloDay,
): Promise<Fetched<WeatherFetchResult>> {
  "use cache";
  cacheLife(CACHE_PROFILE.weather);

  return withFetchedAt(toWeatherResult(await fetchJson(weatherUrl(from, to))));
}
