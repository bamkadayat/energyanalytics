/**
 * Public API of the weather-forecast feature.
 *
 * Import from here and nowhere else — deep imports into this feature's internals are
 * forbidden (context/architecture.md §2).
 *
 * `RawHourlyWeather` and `RawWeatherResponse` are intentionally absent: the provider
 * shape never crosses this boundary, only validated domain data.
 */
export type {
  HourlyWeather,
  ParsedWeather,
  ParseWeatherFailure,
  ParseWeatherResult,
} from "./types";

export { parseHourlyWeather } from "./utils/parse-weather";
