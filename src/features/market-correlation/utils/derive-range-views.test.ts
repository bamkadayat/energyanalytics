import { describe, expect, it } from "vitest";
import type { AlignedHours } from "../types";
import { deriveDurationCurve } from "./derive-range-views";

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
    // Sorted descending: the tenth of hours at the top of the range is the dear one.
    expect(curve.expensiveTenth).toBeGreaterThan(curve.median);
    expect(curve.cheapestTenth).toBeLessThan(curve.median);
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
      expensiveTenth: 0,
      cheapestTenth: 0,
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
