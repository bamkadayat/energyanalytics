/**
 * Single source of stable application configuration.
 *
 * Everything here is read through this module — no coordinate, area code, timezone,
 * or base URL literal may appear inside a feature. See context/architecture.md §9.
 *
 * Both providers are public and unauthenticated, so there are no secrets today. This
 * module stays the single door anyway, so that remains true by construction if one is
 * ever added.
 */

/** IANA zone used for fetching, day selection, labels, and timestamp alignment. */
export const APP_TIME_ZONE = "Europe/Oslo" as const;

/**
 * Locale for number and date formatting. Units always stay explicit alongside.
 *
 * `en-GB`, not `nb-NO` (2026-08-14). The interface is written in English and the document
 * is `lang="en"`, so Norwegian numerals were a genuine misreading risk rather than a
 * stylistic one: `1,322` NOK/kWh is *one point three two two*, but a screen reader in an
 * `en` document announces it as one thousand three hundred and twenty-two.
 *
 * `en-GB` rather than `en-US` because these formatters also produce every hour label in
 * the app. `en-US` renders `02:00 PM` where the market — and the rest of this interface —
 * says `14:00`. `en-GB` keeps 24-hour time and day-first dates, and only the separators
 * change: `1.322` and `2,160`.
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

/**
 * The only weather variables this app requests. Requesting more would inflate the
 * payload for data the interface never shows.
 */
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
 * Query parameters that pin Open-Meteo's response to the contract this app assumes.
 * All three were verified against the live API.
 *
 * - `wind_speed_unit=ms`: Open-Meteo answers **km/h** by default. Without this, every
 *   wind reading would be ~3.6x too large while labelled "m/s" — a wrong chart that
 *   looks entirely plausible.
 * - `timeformat=unixtime`: the default returns naive local strings ("2026-08-09T00:00")
 *   whose zone lives in a separate field, which `new Date()` would silently read in the
 *   server's zone. Epoch seconds are unambiguous.
 * - `timezone`: makes `start_date`/`end_date` mean an Oslo calendar day.
 */
export const WEATHER_REQUEST_PARAMS = {
  timezone: APP_TIME_ZONE,
  timeformat: "unixtime",
  wind_speed_unit: "ms",
} as const;

export const DEFAULT_WEATHER_METRIC: WeatherMetricId = "wind";

/** Price unit shown throughout. Excludes VAT, grid charges, and other consumer costs. */
export const PRICE_UNIT = "NOK/kWh" as const;

/**
 * How many days of history the range views cover.
 *
 * 30 days is 720 hourly points — enough for the weekly shape to be visible in the
 * heatmap and for the duration curve to mean something, while staying one Open-Meteo
 * request and 30 cached price requests.
 */
export const RANGE_DAYS = 30;

/**
 * Selectable range lengths, in days.
 *
 * Capped at 60 deliberately. The price API is one request per day, so a 90-day option
 * would fire 90 parallel requests at one host on a cold cache — a rate-limit risk for a
 * view nobody asked for. 60 days is still 1,440 hourly points.
 */
export const RANGE_DAY_OPTIONS = [7, 14, 30, 60] as const;

/**
 * Span of the hour-by-hour table at `/dashboard/hours` — about 2,200 rows.
 *
 * Ninety days rather than the range views' 60 because this view exists to be *large*:
 * sorting, filtering and scrolling only become interesting past a few thousand rows.
 * Open-Meteo serves the whole span in one request; prices are one request per day, all
 * cached, so the cost is paid once per day and shared with the range views below 60.
 */
export const HOURS_TABLE_DAYS = 90;

export type RangeDays = (typeof RANGE_DAY_OPTIONS)[number];

/**
 * The day the landing page's preview chart shows.
 *
 * Fixed on purpose: a constant date needs no clock, so the preview is **real market data
 * that still prerenders statically**. Reading "today" would make the marketing page
 * request-time for a decorative chart.
 *
 * Labelled as an example day in the UI, because it is one.
 */
export const PREVIEW_DAY = { year: 2026, month: 8, day: 7 } as const;

/** Hour the preview highlights — late afternoon, where the two curves diverge. */
export const PREVIEW_HOUR_INDEX = 16;

export type DaySelection = "today" | "tomorrow";

export const DEFAULT_DAY: DaySelection = "today";

/**
 * Hour (in APP_TIME_ZONE) after which tomorrow's day-ahead prices are normally
 * published. Before this, an empty response means "not published yet" rather than an
 * error — the distinction drives both the UI state and the cache lifetime below.
 */
export const TOMORROW_PRICES_PUBLISHED_HOUR = 13;

/**
 * `cacheLife` profiles, keyed by what is being cached rather than by provider.
 *
 * `pricesPending` is deliberately the shortest: caching a not-yet-published miss for
 * hours would hide prices that appear moments later. Never reuse `pricesSettled` for
 * a pending day.
 */
export const CACHE_PROFILE = {
  weather: "hours",
  pricesSettled: "hours",
  pricesPending: "minutes",
} as const;
