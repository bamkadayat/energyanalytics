import { describe, expect, it } from "vitest";
import { DEFAULT_DAY, DEFAULT_WEATHER_METRIC } from "@/shared/config";
import { hrefWith, parseViewParams, viewParamsHref } from "./view-params";

describe("parseViewParams", () => {
  it("reads valid params", () => {
    expect(parseViewParams({ day: "tomorrow", metric: "solar" })).toEqual({
      day: "tomorrow",
      metric: "solar",
    });
  });

  it("falls back to defaults when params are absent", () => {
    expect(parseViewParams({})).toEqual({
      day: DEFAULT_DAY,
      metric: DEFAULT_WEATHER_METRIC,
    });
  });

  it("falls back rather than throwing on unknown values", () => {
    // A hand-edited or stale URL should show the default view, not an error page: these
    // params are a preference, not a resource identifier.
    expect(parseViewParams({ day: "yesterday", metric: "humidity" })).toEqual({
      day: DEFAULT_DAY,
      metric: DEFAULT_WEATHER_METRIC,
    });
  });

  it("falls back per field, keeping the valid one", () => {
    expect(parseViewParams({ day: "tomorrow", metric: "rainfall" })).toEqual({
      day: "tomorrow",
      metric: DEFAULT_WEATHER_METRIC,
    });
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
    });
  });
});

describe("viewParamsHref", () => {
  it("writes both params explicitly, so a shared link carries the whole view", () => {
    expect(viewParamsHref({ day: "today", metric: "wind" })).toBe(
      "?day=today&metric=wind",
    );
  });

  it("round-trips through the parser", () => {
    const params = { day: "tomorrow", metric: "temperature" } as const;
    const search = Object.fromEntries(
      new URLSearchParams(viewParamsHref(params)).entries(),
    );

    expect(parseViewParams(search)).toEqual(params);
  });
});

describe("hrefWith", () => {
  const current = { day: "today", metric: "wind" } as const;

  it("changes one field and keeps the rest", () => {
    expect(hrefWith(current, { metric: "solar" })).toBe("?day=today&metric=solar");
    expect(hrefWith(current, { day: "tomorrow" })).toBe("?day=tomorrow&metric=wind");
  });

  it("is a no-op href when nothing changes", () => {
    expect(hrefWith(current, {})).toBe(viewParamsHref(current));
  });
});
