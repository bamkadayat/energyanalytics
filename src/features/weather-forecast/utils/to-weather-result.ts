import type { FetchJsonOutcome } from "@/shared/lib/fetch-json";
import type { WeatherFetchResult } from "../types";
import { parseHourlyWeather } from "./parse-weather";

/**
 * Transport outcome to domain result. Note the asymmetry with prices: a 404 here really
 * is an error, because a forecast in the supported range always exists.
 */
export function toWeatherResult(outcome: FetchJsonOutcome): WeatherFetchResult {
  if (!outcome.ok) {
    return { status: "error", reason: outcome.reason };
  }

  const parsed = parseHourlyWeather(outcome.data);
  if (!parsed.ok) {
    return { status: "error", reason: parsed.reason };
  }

  return {
    status: "ok",
    weather: parsed.data.weather,
    unavailableMetrics: parsed.data.unavailableMetrics,
    droppedHours: parsed.data.droppedHours,
  };
}
