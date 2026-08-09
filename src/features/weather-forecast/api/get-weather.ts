import { cacheLife } from "next/cache";
import {
  API_BASE_URL,
  WEATHER_LOCATION,
  WEATHER_METRICS,
  WEATHER_METRIC_IDS,
  WEATHER_REQUEST_PARAMS,
} from "@/shared/config";
import { fetchJson } from "@/shared/lib/fetch-json";
import { isoDateFor, type OsloDay } from "@/shared/lib/oslo-day";
import type { WeatherFetchResult } from "../types";
import { toWeatherResult } from "../utils/to-weather-result";

/**
 * Requests only the three hourly variables the interface renders — asking for more would
 * inflate the payload for data nothing displays.
 *
 * `start_date`/`end_date` are the same Oslo calendar day, which returns exactly that
 * day's hours (23, 24 or 25 depending on DST) rather than a rolling window.
 */
function weatherUrl(day: OsloDay): string {
  const date = isoDateFor(day);

  const params = new URLSearchParams({
    latitude: String(WEATHER_LOCATION.latitude),
    longitude: String(WEATHER_LOCATION.longitude),
    hourly: WEATHER_METRIC_IDS.map((id) => WEATHER_METRICS[id].variable).join(","),
    start_date: date,
    end_date: date,
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
export async function getWeather(day: OsloDay): Promise<WeatherFetchResult> {
  "use cache";
  cacheLife("hours");

  return toWeatherResult(await fetchJson(weatherUrl(day)));
}
