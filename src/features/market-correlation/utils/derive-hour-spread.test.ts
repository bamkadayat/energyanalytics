import { describe, expect, it } from "vitest";
import type { AlignedHours } from "../types";
import { deriveHourSpread } from "./derive-hour-spread";

/** 2026-08-09T00:00 Europe/Oslo. */
const MIDNIGHT_OSLO = Date.UTC(2026, 7, 8, 22, 0, 0);
const at = (hour: number) => new Date(MIDNIGHT_OSLO + hour * 3_600_000);

function range(prices: Array<number | null>): AlignedHours {
  return {
    metricId: "wind",
    hours: prices.map((_, index) => at(index)),
    nokPerKwh: prices,
    metricValues: prices.map(() => null),
    coverage: {
      matchedHours: 0,
      priceOnlyHours: 0,
      weatherOnlyHours: 0,
      duplicateHours: 0,
    },
  };
}

describe("deriveHourSpread", () => {
  it("buckets by hour of day, not by position", () => {
    // Three days: 00:00 is cheap every day, 01:00 dear every day.
    const prices = Array.from({ length: 72 }, (_, index) =>
      index % 24 === 0 ? 0.1 : index % 24 === 1 ? 2 : 1,
    );

    const spread = deriveHourSpread(range(prices));

    expect(spread.boxes[0]).toEqual([0.1, 0.1, 0.1, 0.1, 0.1]);
    expect(spread.boxes[1]).toEqual([2, 2, 2, 2, 2]);
    expect(spread.counts[0]).toBe(3);
  });

  it("reports the five-number summary in ECharts' order", () => {
    // One hour of the day, eight observations: 1..8.
    const prices: Array<number | null> = [];
    for (let day = 0; day < 8; day += 1) {
      for (let hour = 0; hour < 24; hour += 1) {
        prices.push(hour === 5 ? day + 1 : null);
      }
    }

    const [min, q1, median, q3, max] = deriveHourSpread(range(prices)).boxes[5] as number[];

    // Nearest rank over [1..8]: no interpolation, so every figure is a real price.
    expect(min).toBe(1);
    expect(q1).toBe(2);
    expect(median).toBe(4);
    expect(q3).toBe(6);
    expect(max).toBe(8);
  });

  it("leaves an hour with no prices as a gap, not a zero", () => {
    const spread = deriveHourSpread(range([1, null, 3]));

    expect(spread.boxes[1]).toBeNull();
    expect(spread.counts[1]).toBe(0);
    // 21 hours were never in the range at all, plus the one that was null.
    expect(spread.emptyHours).toBe(22);
  });

  it("gives a single observation no spread", () => {
    expect(deriveHourSpread(range([1.5])).boxes[0]).toEqual([1.5, 1.5, 1.5, 1.5, 1.5]);
  });

  it("takes the extremes across every hour for the axis", () => {
    const spread = deriveHourSpread(range([0.2, 5, 1]));

    expect(spread.min).toBe(0.2);
    expect(spread.max).toBe(5);
  });

  it("survives a range with no prices at all", () => {
    const spread = deriveHourSpread(range([null, null]));

    expect(spread.boxes.every((box) => box === null)).toBe(true);
    expect(spread.min).toBe(0);
    expect(spread.max).toBe(0);
    expect(spread.emptyHours).toBe(24);
  });
});
