/**
 * Public API of the weather-forecast feature.
 *
 * Import from here and nowhere else — deep imports into this feature's internals are
 * forbidden (context/architecture.md §2).
 *
 * `RawHourlyWeather` and `RawWeatherResponse` are intentionally absent: the provider
 * shape never crosses this boundary, only validated domain data.
 *
 * The fetcher is server-only — it uses `use cache`. Client components must import only
 * the types from here.
 */
export type {
  HourlyWeather,
  ParsedWeather,
  ParseWeatherFailure,
  ParseWeatherResult,
  WeatherErrorReason,
  WeatherFetchResult,
} from "./types";

export { parseHourlyWeather } from "./utils/parse-weather";
export { toWeatherResult } from "./utils/to-weather-result";
export { getWeather } from "./api/get-weather";
