/**
 * Single source of stable application configuration.
 *
 * No coordinate, area code, timezone or base URL literal may appear inside a feature —
 * see context/architecture.md §9.
 */

/** IANA zone used for fetching, day selection, labels, and timestamp alignment. */
export const APP_TIME_ZONE = "Europe/Oslo" as const;

/**
 * Must stay `en-*` to match `lang="en"` — under `nb-NO` an English screen reader reads
 * `1,322` NOK/kWh as one thousand three hundred. `en-GB` over `en-US` because these
 * formatters also produce hour labels, and `en-US` gives `02:00 PM`, not `14:00`.
 */
export const APP_LOCALE = "en-GB" as const;

/** Price area covered by the first release. */
export const PRICE_AREA = {
  code: "NO1",
  label: "NO1 East Norway",
} as const;

/**
 * Representative weather point for the price area. Oslo is a single location inside a
 * much larger region — the UI must always label it as representative, never as
 * covering NO1.
 */
export const WEATHER_LOCATION = {
  label: "Oslo",
  latitude: 59.9139,
  longitude: 10.7522,
} as const;

export const API_BASE_URL = {
  /** Day-ahead spot prices. Path: /{YYYY}/{MM-DD}_{area}.json */
  prices: "https://www.hvakosterstrommen.no/api/v1/prices",
  weather: "https://api.open-meteo.com/v1/forecast",
} as const;

/** Upper bound on any single provider call before it becomes a domain error. */
export const REQUEST_TIMEOUT_MS = 8_000;

export type WeatherMetricId = "wind" | "temperature" | "solar";

export interface WeatherMetric {
  readonly id: WeatherMetricId;
  readonly label: string;
  /** Hourly variable requested from Open-Meteo. */
  readonly variable: string;
  /** Display unit. Kept beside the value everywhere it is rendered. */
  readonly unit: string;
}

export const WEATHER_METRICS: Readonly<Record<WeatherMetricId, WeatherMetric>> = {
  wind: {
    id: "wind",
    label: "Wind speed",
    variable: "wind_speed_10m",
    unit: "m/s",
  },
  temperature: {
    id: "temperature",
    label: "Temperature",
    variable: "temperature_2m",
    unit: "°C",
  },
  solar: {
    id: "solar",
    label: "Solar radiation",
    variable: "shortwave_radiation",
    unit: "W/m²",
  },
} as const;

export const WEATHER_METRIC_IDS = Object.keys(WEATHER_METRICS) as WeatherMetricId[];

/**
 * Pins Open-Meteo to the contract this app assumes; dropping any changes the data
 * silently. Defaults are km/h (not m/s), a naive local timestamp, and a UTC date range.
 */
export const WEATHER_REQUEST_PARAMS = {
  timezone: APP_TIME_ZONE,
  timeformat: "unixtime",
  wind_speed_unit: "ms",
} as const;

export const DEFAULT_WEATHER_METRIC: WeatherMetricId = "wind";

/** Price unit shown throughout. Excludes VAT, grid charges, and other consumer costs. */
export const PRICE_UNIT = "NOK/kWh" as const;

/** Days of history the range views cover — 720 hourly points. */
export const RANGE_DAYS = 30;

/**
 * Selectable range lengths, in days. Capped at 60: the price API is one request per day,
 * so a 90-day option would fire 90 parallel requests at one host on a cold cache.
 */
export const RANGE_DAY_OPTIONS = [7, 14, 30, 60] as const;

/**
 * Span of the hour-by-hour table at `/dashboard/hours` — about 2,200 rows. Larger than
 * the range views because sorting and filtering only get interesting past a few thousand.
 */
export const HOURS_TABLE_DAYS = 90;

export type RangeDays = (typeof RANGE_DAY_OPTIONS)[number];

export type DaySelection = "today" | "tomorrow";

export const DEFAULT_DAY: DaySelection = "today";

/**
 * Hour (in APP_TIME_ZONE) after which tomorrow's day-ahead prices are normally published.
 * Before it, an empty response means "not published yet" rather than an error.
 */
export const TOMORROW_PRICES_PUBLISHED_HOUR = 13;

/**
 * `cacheLife` profiles, keyed by what is cached rather than by provider.
 *
 * `pricesPending` is the shortest on purpose: caching a not-yet-published miss for hours
 * would hide prices that appear moments later. Never reuse `pricesSettled` for it.
 */
export const CACHE_PROFILE = {
  weather: "hours",
  pricesSettled: "hours",
  pricesPending: "minutes",
} as const;
