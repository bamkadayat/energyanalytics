import { describe, expect, it } from "vitest";
import type { AlignedHours } from "../types";
import { toChartSeries } from "./to-chart-series";

const MIDNIGHT_OSLO = Date.UTC(2026, 7, 8, 22, 0, 0);

function aligned(overrides: Partial<AlignedHours> = {}): AlignedHours {
  return {
    metricId: "wind",
    hours: [0, 1, 2].map((i) => new Date(MIDNIGHT_OSLO + i * 3_600_000)),
    nokPerKwh: [1.35, 1.3, null],
    metricValues: [3.1, null, 5.3],
    coverage: {
      matchedHours: 1,
      priceOnlyHours: 1,
      weatherOnlyHours: 1,
      duplicateHours: 0,
    },
    ...overrides,
  };
}

describe("toChartSeries", () => {
  it("labels hours in Oslo time, not the viewer's timezone", () => {
    // The whole reason labels are strings: an ECharts time axis would relabel these in
    // the browser's zone, so a reader abroad would see different hours against the same
    // values.
    expect(toChartSeries(aligned()).hourLabels).toEqual(["00:00", "01:00", "02:00"]);
  });

  it("carries the metric's own label and unit", () => {
    const series = toChartSeries(aligned({ metricId: "solar" }));

    expect(series.metricLabel).toBe("Solar radiation");
    expect(series.metricUnit).toBe("W/m²");
    expect(series.priceUnit).toBe("NOK/kWh");
  });

  it("passes gaps through as null so the line can break", () => {
    const series = toChartSeries(aligned());

    expect(series.prices).toEqual([1.35, 1.3, null]);
    expect(series.metricValues).toEqual([3.1, null, 5.3]);
  });

  it("keeps every array the same length as the labels", () => {
    const series = toChartSeries(aligned());

    expect(series.prices).toHaveLength(series.hourLabels.length);
    expect(series.metricValues).toHaveLength(series.hourLabels.length);
  });

  it("handles an empty day without throwing", () => {
    const series = toChartSeries(
      aligned({ hours: [], nokPerKwh: [], metricValues: [] }),
    );

    expect(series.hourLabels).toEqual([]);
    expect(series.prices).toEqual([]);
  });

  it("labels a DST fall-back day's repeated hour twice", () => {
    // Both 02:00 rows are real and an hour apart; the axis shows 02:00 twice rather than
    // hiding one.
    const dstStart = Date.UTC(2026, 9, 24, 23, 0, 0);
    const series = toChartSeries(
      aligned({
        hours: [0, 1, 2].map((i) => new Date(dstStart + i * 3_600_000)),
        nokPerKwh: [1, 2, 3],
        metricValues: [1, 2, 3],
      }),
    );

    expect(series.hourLabels).toEqual(["01:00", "02:00", "02:00"]);
  });
});
