import {
  DEFAULT_DAY,
  DEFAULT_WEATHER_METRIC,
  WEATHER_METRIC_IDS,
  type DaySelection,
  type WeatherMetricId,
} from "@/shared/config";

/**
 * The view's entire state, and the URL is where it lives.
 *
 * Keeping day and metric in search params rather than component state makes every view
 * linkable, shareable and restorable, and means the back button works. Nothing else in
 * the app stores these — everything derives from them.
 */
export interface ViewParams {
  day: DaySelection;
  metric: WeatherMetricId;
  /** Whether the day's data is drawn as a chart or listed as a table. */
  view: ViewMode;
}

export type ViewMode = "chart" | "table";

/** Query-string keys. Named here so the parser and the link builder cannot drift. */
export const VIEW_PARAM_KEYS = {
  day: "day",
  metric: "metric",
  view: "view",
} as const;

const DAY_SELECTIONS: readonly DaySelection[] = ["today", "tomorrow"];
const VIEW_MODES: readonly ViewMode[] = ["chart", "table"];

/**
 * Shape Next hands to a page, once the `searchParams` promise is awaited. A key can be
 * absent, a single value, or repeated (`?day=today&day=tomorrow`).
 */
export type SearchParamsInput = Record<string, string | string[] | undefined>;

/**
 * Resolves URL params to a valid view, always.
 *
 * Never throws and never 404s on a bad value. A hand-edited or stale URL should show the
 * default view, not an error page — the params are a *preference*, not a resource
 * identifier, and there is no such thing as a day or metric that does not exist here.
 */
export function parseViewParams(input: SearchParamsInput): ViewParams {
  return {
    day: parseDay(input[VIEW_PARAM_KEYS.day]),
    metric: parseMetric(input[VIEW_PARAM_KEYS.metric]),
    view: parseView(input[VIEW_PARAM_KEYS.view]),
  };
}

function parseView(raw: string | string[] | undefined): ViewMode {
  const value = normalize(raw);
  return VIEW_MODES.find((mode) => mode === value) ?? "chart";
}

function parseDay(raw: string | string[] | undefined): DaySelection {
  const value = normalize(raw);
  return DAY_SELECTIONS.find((day) => day === value) ?? DEFAULT_DAY;
}

function parseMetric(raw: string | string[] | undefined): WeatherMetricId {
  const value = normalize(raw);
  return WEATHER_METRIC_IDS.find((id) => id === value) ?? DEFAULT_WEATHER_METRIC;
}

/**
 * A repeated param yields an array; take the first, matching how a browser form and
 * `URLSearchParams.get` both behave. Trimmed and lowercased so a hand-typed
 * `?day=Tomorrow` works rather than silently falling back.
 */
function normalize(raw: string | string[] | undefined): string | undefined {
  const value = Array.isArray(raw) ? raw[0] : raw;
  return typeof value === "string" ? value.trim().toLowerCase() : undefined;
}

/**
 * Builds the href for a view, writing both params explicitly.
 *
 * Always emitting both keeps links stable and self-describing: a shared URL carries the
 * full view rather than depending on which defaults happened to apply when it was
 * copied.
 */
export function viewParamsHref(params: ViewParams): string {
  const search = new URLSearchParams({
    [VIEW_PARAM_KEYS.day]: params.day,
    [VIEW_PARAM_KEYS.metric]: params.metric,
    [VIEW_PARAM_KEYS.view]: params.view,
  });

  return `?${search.toString()}`;
}

/** Href for the same view with one field changed — what the day/metric controls link to. */
export function hrefWith(current: ViewParams, change: Partial<ViewParams>): string {
  return viewParamsHref({ ...current, ...change });
}
