import type { FetchJsonOutcome } from "@/shared/lib/fetch-json";
import type { WeatherFetchResult } from "../types";
import { parseHourlyWeather } from "./parse-weather";

/**
 * Turns a transport outcome into a domain result.
 *
 * Pure and separate from the fetcher so every branch is testable without a network or
 * the Next cache runtime.
 *
 * Note the asymmetry with prices: a 404 here really is an error. A forecast for a day in
 * the supported range always exists, so its absence means the request or the provider is
 * wrong, not that the world has yet to produce the data.
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
