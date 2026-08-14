import type { WeatherMetricId } from "@/shared/config";

/**
 * Open-Meteo's shape, mirrored as received. Untrusted — only this feature's parser may
 * consume it. The columnar layout is preserved all the way to the chart.
 */
export interface RawHourlyWeather {
  time: unknown;
  wind_speed_10m?: unknown;
  temperature_2m?: unknown;
  shortwave_radiation?: unknown;
}

export interface RawWeatherResponse {
  hourly?: unknown;
}

/**
 * Validated forecast, still columnar: `times[i]` describes `values[metric][i]`. A `null`
 * is a real gap, never a zero — zero wind and missing wind are different facts.
 */
export interface HourlyWeather {
  /** Absolute instants, ascending, one per hour. */
  times: Date[];
  /** Parallel arrays, each exactly `times.length` long. */
  values: Readonly<Record<WeatherMetricId, ReadonlyArray<number | null>>>;
}

export type ParseWeatherResult =
  | { ok: true; data: ParsedWeather }
  | { ok: false; reason: ParseWeatherFailure };

export interface ParsedWeather {
  weather: HourlyWeather;
  /**
   * Metrics the payload could not supply — absent, not an array, or a length that did
   * not match `time`. Their series are filled with `null` rather than dropped, so the
   * columnar contract holds. Surface these as partial data.
   */
  unavailableMetrics: WeatherMetricId[];
  /**
   * Hours discarded because their timestamp could not be resolved to an unambiguous
   * instant. Non-zero means the provider's time format changed — investigate rather
   * than ignore.
   */
  droppedHours: number;
}

export type ParseWeatherFailure = "malformed-payload" | "no-usable-hours";

/**
 * Outcome of asking Open-Meteo for one day's hourly forecast.
 *
 * There is no `not-published` arm: unlike day-ahead prices, a forecast for tomorrow
 * always exists.
 */
export type WeatherFetchResult =
  | {
      status: "ok";
      weather: HourlyWeather;
      unavailableMetrics: WeatherMetricId[];
      droppedHours: number;
    }
  | { status: "error"; reason: WeatherErrorReason };

export type WeatherErrorReason =
  | "not-found"
  | "timeout"
  | "network"
  | "provider-error"
  | "invalid-json"
  | "malformed-payload"
  | "no-usable-hours";
