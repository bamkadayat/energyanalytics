import { describe, expect, it } from "vitest";
import type { AlignedHours } from "../types";
import { summariseMetric, toPreviewChart } from "./to-preview-chart";

const MIDNIGHT_OSLO = Date.UTC(2026, 7, 6, 22, 0, 0);

function aligned(
  prices: Array<number | null>,
  metrics: Array<number | null> = prices.map(() => null),
): AlignedHours {
  return {
    metricId: "solar",
    hours: prices.map((_, i) => new Date(MIDNIGHT_OSLO + i * 3_600_000)),
    nokPerKwh: prices,
    metricValues: metrics,
    coverage: {
      matchedHours: 0,
      priceOnlyHours: 0,
      weatherOnlyHours: 0,
      duplicateHours: 0,
    },
  };
}

const labels = (n: number) => Array.from({ length: n }, (_, i) => String(i).padStart(2, "0"));

describe("toPreviewChart", () => {
  it("spans the plot from first hour to last, inset from the viewBox edge", () => {
    // Inset on purpose: at x=0 the midnight tick's own glyph is half-clipped by the
    // viewBox, and the curves read as cropped rather than drawn.
    const chart = toPreviewChart(aligned([1, 2, 3, 4]), labels(4), 0);

    expect(chart.plotLeft).toBeGreaterThan(0);
    expect(chart.plotRight).toBeLessThan(chart.width);
    expect(chart.priceLine.startsWith(`M${chart.plotLeft},`)).toBe(true);
    expect(chart.priceLine).toContain(String(chart.plotRight));
    expect(chart.ticks[0]?.x).toBe(chart.plotLeft);
  });

  it("puts the highest value nearest the top", () => {
    // SVG y grows downward, so the maximum must map to the smaller number.
    const chart = toPreviewChart(aligned([1, 5]), labels(2), 1);
    const low = toPreviewChart(aligned([1, 5]), labels(2), 0);

    expect(chart.highlight?.priceY).toBeLessThan(low.highlight?.priceY ?? 0);
  });

  it("scales each series against its own range", () => {
    // Price 0–1 and metric 0–600 both fill the height; the two are comparable in shape
    // only, exactly as the real chart's dual axes are.
    const chart = toPreviewChart(aligned([0, 1], [0, 600]), labels(2), 1);

    expect(chart.highlight?.priceY).toBeCloseTo(chart.highlight?.metricY ?? -1, 5);
  });

  it("breaks the line at a gap instead of bridging it", () => {
    // Connecting across a missing hour would draw data that does not exist.
    const chart = toPreviewChart(aligned([1, null, 3]), labels(3), 0);

    expect(chart.priceLine.split("M").length - 1).toBe(2);
  });

  it("omits the metric line entirely when there are no readings", () => {
    expect(toPreviewChart(aligned([1, 2, 3]), labels(3), 0).metricLine).toBe("");
  });

  it("closes the area path back to the baseline, along the plot edges", () => {
    const chart = toPreviewChart(aligned([1, 2]), labels(2), 0);

    expect(chart.priceArea.endsWith("Z")).toBe(true);
    expect(chart.priceArea).toContain(`L${chart.plotLeft},${chart.height}`);
    expect(chart.priceArea).toContain(`L${chart.plotRight},${chart.height}`);
  });

  it("closes the metric area the same way, so a filled metric cannot skew", () => {
    // The area used to be assembled in the component with the viewBox width, which put a
    // wedge under the right-hand end once the plot was inset.
    const chart = toPreviewChart(aligned([1, 2], [3, 4]), labels(2), 0);

    expect(chart.metricArea.endsWith("Z")).toBe(true);
    expect(chart.metricArea).toContain(`L${chart.plotRight},${chart.height}`);
  });

  it("omits the metric area when there are no readings", () => {
    expect(toPreviewChart(aligned([1, 2]), labels(2), 0).metricArea).toBe("");
  });

  it("labels every third hour", () => {
    const chart = toPreviewChart(aligned(Array.from({ length: 24 }, (_, i) => i)), labels(24), 0);

    expect(chart.ticks.map((t) => t.label)).toEqual([
      "00", "03", "06", "09", "12", "15", "18", "21",
    ]);
  });

  it("reports the highlighted hour's actual values", () => {
    const chart = toPreviewChart(aligned([1, 2, 3], [10, 20, 30]), labels(3), 1);

    expect(chart.highlight?.price).toBe(2);
    expect(chart.highlight?.metricValue).toBe(20);
    expect(chart.highlight?.hourLabel).toBe("01");
  });

  it("returns no highlight for an out-of-range index", () => {
    expect(toPreviewChart(aligned([1, 2]), labels(2), 99).highlight).toBeNull();
  });

  it("pins a flat series to the middle rather than dividing by zero", () => {
    const chart = toPreviewChart(aligned([2, 2, 2]), labels(3), 1);

    expect(Number.isFinite(chart.highlight?.priceY ?? Number.NaN)).toBe(true);
  });

  it("handles an empty day without throwing", () => {
    const chart = toPreviewChart(aligned([]), [], 0);

    expect(chart.priceLine).toBe("");
    expect(chart.highlight).toBeNull();
  });
});

describe("summariseMetric", () => {
  const labels = (n: number) =>
    Array.from({ length: n }, (_, i) => `${String(i).padStart(2, "0")}:00`);

  it("reports range and peak hour", () => {
    const stats = summariseMetric(aligned([1, 2, 3], [3.1, 8.2, 5]), labels(3));

    expect(stats.min).toBe(3.1);
    expect(stats.max).toBe(8.2);
    expect(stats.peakHourLabel).toBe("01:00");
  });

  it("counts missing readings rather than hiding them", () => {
    const stats = summariseMetric(aligned([1, 2, 3], [4, null, 6]), labels(3));

    expect(stats.missing).toBe(1);
    expect(stats.total).toBe(3);
  });

  it("excludes gaps from the range", () => {
    const stats = summariseMetric(aligned([1, 2], [null, 7]), labels(2));

    expect(stats.min).toBe(7);
    expect(stats.max).toBe(7);
  });

  it("breaks a tie on the earliest hour", () => {
    const stats = summariseMetric(aligned([1, 2, 3], [5, 5, 1]), labels(3));

    expect(stats.peakHourLabel).toBe("00:00");
  });

  it("handles a metric with no readings at all", () => {
    const stats = summariseMetric(aligned([1, 2], [null, null]), labels(2));

    expect(stats.max).toBeNull();
    expect(stats.peakHourLabel).toBeNull();
    expect(stats.missing).toBe(2);
  });
});
