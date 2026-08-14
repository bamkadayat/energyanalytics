/**
 * Public API of the weather-forecast feature. Deep imports are forbidden
 * (context/architecture.md §2), and the raw provider shapes stay inside deliberately.
 *
 * The fetcher is server-only (`use cache`); client components may import only types.
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
export { getWeather, getWeatherRange } from "./api/get-weather";
