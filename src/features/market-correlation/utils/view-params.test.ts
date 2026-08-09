import { describe, expect, it } from "vitest";
import { DEFAULT_DAY, DEFAULT_WEATHER_METRIC } from "@/shared/config";
import { hrefWith, parseViewParams, viewParamsHref } from "./view-params";

describe("parseViewParams", () => {
  it("reads valid params", () => {
    expect(parseViewParams({ day: "tomorrow", metric: "solar" })).toEqual({
      day: "tomorrow",
      metric: "solar",
      view: "chart",
      heatmap: "chart",
      curve: "chart",
    });
  });

  it("falls back to defaults when params are absent", () => {
    expect(parseViewParams({})).toEqual({
      day: DEFAULT_DAY,
      metric: DEFAULT_WEATHER_METRIC,
      view: "chart",
      heatmap: "chart",
      curve: "chart",
    });
  });

  it("falls back rather than throwing on unknown values", () => {
    // A hand-edited or stale URL should show the default view, not an error page: these
    // params are a preference, not a resource identifier.
    expect(parseViewParams({ day: "yesterday", metric: "humidity" })).toEqual({
      day: DEFAULT_DAY,
      metric: DEFAULT_WEATHER_METRIC,
      view: "chart",
      heatmap: "chart",
      curve: "chart",
    });
  });

  it("falls back per field, keeping the valid one", () => {
    expect(parseViewParams({ day: "tomorrow", metric: "rainfall" })).toEqual({
      day: "tomorrow",
      metric: DEFAULT_WEATHER_METRIC,
      view: "chart",
      heatmap: "chart",
      curve: "chart",
    });
  });

  it("defaults every section to chart and accepts an explicit table", () => {
    expect(parseViewParams({}).view).toBe("chart");
    expect(parseViewParams({ view: "table" }).view).toBe("table");
    expect(parseViewParams({ view: "spreadsheet" }).view).toBe("chart");
  });

  it("keeps each section's mode independent", () => {
    // Switching the heatmap to a table must not change the day view.
    const params = parseViewParams({ heatmap: "table" });

    expect(params.heatmap).toBe("table");
    expect(params.view).toBe("chart");
    expect(params.curve).toBe("chart");
  });

  it("accepts every configured metric", () => {
    for (const metric of ["wind", "temperature", "solar"] as const) {
      expect(parseViewParams({ metric }).metric).toBe(metric);
    }
  });

  it("tolerates case and surrounding whitespace", () => {
    expect(parseViewParams({ day: " Tomorrow ", metric: "SOLAR" })).toEqual({
      day: "tomorrow",
      metric: "solar",
      view: "chart",
      heatmap: "chart",
      curve: "chart",
    });
  });

  it("takes the first value when a param is repeated", () => {
    // ?day=today&day=tomorrow arrives as an array; browsers and URLSearchParams.get
    // both take the first.
    expect(parseViewParams({ day: ["tomorrow", "today"] }).day).toBe("tomorrow");
  });

  it("ignores unrelated params", () => {
    expect(parseViewParams({ utm_source: "x", day: "tomorrow" }).day).toBe("tomorrow");
  });

  it("handles non-string values without throwing", () => {
    const hostile = { day: [], metric: undefined } as Record<
      string,
      string | string[] | undefined
    >;

    expect(parseViewParams(hostile)).toEqual({
      day: DEFAULT_DAY,
      metric: DEFAULT_WEATHER_METRIC,
      view: "chart",
      heatmap: "chart",
      curve: "chart",
    });
  });
});

describe("viewParamsHref", () => {
  it("writes both params explicitly, so a shared link carries the whole view", () => {
    expect(
      viewParamsHref({
        day: "today",
        metric: "wind",
        view: "chart",
        heatmap: "chart",
        curve: "chart",
      }),
    ).toBe("?day=today&metric=wind&view=chart&heatmap=chart&curve=chart");
  });

  it("round-trips through the parser", () => {
    const params = {
      day: "tomorrow",
      metric: "temperature",
      view: "table",
      heatmap: "chart",
      curve: "table",
    } as const;
    const search = Object.fromEntries(
      new URLSearchParams(viewParamsHref(params)).entries(),
    );

    expect(parseViewParams(search)).toEqual(params);
  });
});

describe("hrefWith", () => {
  const current = {
    day: "today",
    metric: "wind",
    view: "chart",
    heatmap: "chart",
    curve: "chart",
  } as const;

  it("changes one field and keeps the rest", () => {
    expect(hrefWith(current, { metric: "solar" })).toContain("metric=solar");
    expect(hrefWith(current, { day: "tomorrow" })).toContain("day=tomorrow");
  });

  it("is a no-op href when nothing changes", () => {
    expect(hrefWith(current, {})).toBe(viewParamsHref(current));
  });
});
