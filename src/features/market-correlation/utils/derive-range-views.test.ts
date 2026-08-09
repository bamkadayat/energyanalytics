import { describe, expect, it } from "vitest";
import type { AlignedHours } from "../types";
import { deriveDurationCurve, derivePriceHeatmap } from "./derive-range-views";

/** 2026-08-09T00:00 Europe/Oslo. */
const MIDNIGHT_OSLO = Date.UTC(2026, 7, 8, 22, 0, 0);

function range(hourCount: number, price: (i: number) => number | null): AlignedHours {
  return {
    metricId: "wind",
    hours: Array.from(
      { length: hourCount },
      (_, i) => new Date(MIDNIGHT_OSLO + i * 3_600_000),
    ),
    nokPerKwh: Array.from({ length: hourCount }, (_, i) => price(i)),
    metricValues: Array.from({ length: hourCount }, () => null),
    coverage: {
      matchedHours: 0,
      priceOnlyHours: 0,
      weatherOnlyHours: 0,
      duplicateHours: 0,
    },
  };
}

describe("derivePriceHeatmap", () => {
  it("lays 72 hours out as three day columns of 24", () => {
    const heatmap = derivePriceHeatmap(range(72, (i) => i / 100));

    expect(heatmap.dayLabels).toHaveLength(3);
    expect(heatmap.hourLabels).toHaveLength(24);
    expect(heatmap.cells).toHaveLength(72);
  });

  it("places each hour at its Oslo hour of day, not its index", () => {
    // Index 25 is the second hour of day two: hour 1, day index 1.
    const heatmap = derivePriceHeatmap(range(48, (i) => i));
    const cell = heatmap.cells.find(([, , value]) => value === 25);

    expect(cell?.[0]).toBe(1);
    expect(cell?.[1]).toBe(1);
  });

  it("omits hours with no price rather than sending nulls", () => {
    // Payload stays proportional to the data that exists.
    const heatmap = derivePriceHeatmap(range(24, (i) => (i % 2 === 0 ? i : null)));

    expect(heatmap.cells).toHaveLength(12);
    expect(heatmap.cells.every(([, , value]) => value !== null)).toBe(true);
  });

  it("reports min and max across the whole range", () => {
    const heatmap = derivePriceHeatmap(range(48, (i) => i / 10));

    expect(heatmap.min).toBe(0);
    expect(heatmap.max).toBeCloseTo(4.7, 5);
  });

  it("keeps negative prices in the scale", () => {
    const heatmap = derivePriceHeatmap(range(24, (i) => (i === 3 ? -0.5 : 1)));

    expect(heatmap.min).toBe(-0.5);
  });

  it("counts, rather than hides, an hour collapsed by a DST fall-back", () => {
    // 2026-10-25: the clock reads 02:00 twice, and the grid has one cell for it.
    const dstStart = Date.UTC(2026, 9, 24, 22, 0, 0);
    const aligned: AlignedHours = {
      metricId: "wind",
      hours: Array.from({ length: 25 }, (_, i) => new Date(dstStart + i * 3_600_000)),
      nokPerKwh: Array.from({ length: 25 }, (_, i) => i),
      metricValues: Array.from({ length: 25 }, () => null),
      coverage: {
        matchedHours: 0,
        priceOnlyHours: 0,
        weatherOnlyHours: 0,
        duplicateHours: 0,
      },
    };

    const heatmap = derivePriceHeatmap(aligned);

    expect(heatmap.collapsedHours).toBe(1);
    expect(heatmap.cells).toHaveLength(24);
  });

  it("returns a usable empty shape for no data", () => {
    const heatmap = derivePriceHeatmap(range(0, () => null));

    expect(heatmap.cells).toEqual([]);
    expect(heatmap.min).toBe(0);
    expect(heatmap.max).toBe(0);
  });
});

describe("deriveDurationCurve", () => {
  it("sorts every priced hour from most to least expensive", () => {
    const curve = deriveDurationCurve(range(5, (i) => [3, 1, 5, 2, 4][i]));

    expect(curve.prices).toEqual([5, 4, 3, 2, 1]);
  });

  it("runs percentiles from just above 0 to exactly 100", () => {
    const curve = deriveDurationCurve(range(4, (i) => i));

    expect(curve.percentiles).toEqual([25, 50, 75, 100]);
  });

  it("excludes hours with no price from the curve and the count", () => {
    const curve = deriveDurationCurve(range(10, (i) => (i < 6 ? i : null)));

    expect(curve.hours).toBe(6);
    expect(curve.prices).toHaveLength(6);
  });

  it("reports median and deciles", () => {
    const curve = deriveDurationCurve(range(100, (i) => i));

    expect(curve.median).toBe(49);
    // Sorted descending, so p10 is near the expensive end.
    expect(curve.p10).toBeGreaterThan(curve.median);
    expect(curve.p90).toBeLessThan(curve.median);
  });

  it("keeps negative prices, which the Nordic market produces", () => {
    const curve = deriveDurationCurve(range(3, (i) => [0.5, -0.02, 1][i]));

    expect(curve.prices).toEqual([1, 0.5, -0.02]);
  });

  it("returns a usable empty shape for no data", () => {
    const curve = deriveDurationCurve(range(0, () => null));

    expect(curve).toEqual({
      prices: [],
      percentiles: [],
      median: 0,
      p10: 0,
      p90: 0,
      hours: 0,
    });
  });

  it("handles a full 30-day range", () => {
    const curve = deriveDurationCurve(range(720, (i) => Math.sin(i / 12) + 1.5));

    expect(curve.hours).toBe(720);
    expect(curve.prices[0]).toBeGreaterThanOrEqual(curve.prices[719]);
    expect(curve.percentiles[719]).toBe(100);
  });
});
