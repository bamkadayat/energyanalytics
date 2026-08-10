import { describe, expect, it } from "vitest";
import type { AlignedHours } from "../types";
import {
  deriveCheapestWindow,
  deriveDaySummary,
  deriveEveningComparison,
} from "./derive-summary";

/** 2026-08-09T00:00 Europe/Oslo. */
const MIDNIGHT_OSLO = Date.UTC(2026, 7, 8, 22, 0, 0);
const at = (hour: number) => new Date(MIDNIGHT_OSLO + hour * 3_600_000);

function day(
  prices: Array<number | null>,
  metrics: Array<number | null> = prices.map(() => null),
): AlignedHours {
  return {
    metricId: "wind",
    hours: prices.map((_, index) => at(index)),
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

describe("deriveDaySummary", () => {
  it("averages only the hours that have a price", () => {
    // A gap must not be averaged as zero, which would drag the mean down.
    const summary = deriveDaySummary(day([1, null, 3]), at(0));

    expect(summary.averageNokPerKwh).toBe(2);
  });

  it("returns a null average when no hour has a price", () => {
    expect(deriveDaySummary(day([null, null]), at(0)).averageNokPerKwh).toBeNull();
  });

  it("finds the cheapest and priciest hours", () => {
    const summary = deriveDaySummary(day([1.2, 0.4, 2.5, 0.9]), at(0));

    expect(summary.cheapestHour).toEqual({ at: at(1), value: 0.4 });
    expect(summary.priciestHour).toEqual({ at: at(2), value: 2.5 });
  });

  it("keeps negative prices as genuine minima", () => {
    // Nordic spot prices go negative; treating that as missing would report the wrong
    // cheapest hour.
    const summary = deriveDaySummary(day([0.5, -0.02, 0.3]), at(0));

    expect(summary.cheapestHour?.value).toBe(-0.02);
  });

  it("breaks ties on the earliest hour, so the answer is stable", () => {
    const summary = deriveDaySummary(day([0.4, 0.4, 0.9]), at(0));

    expect(summary.cheapestHour?.at).toEqual(at(0));
  });

  it("reports the hour containing now", () => {
    // Mid-hour: 14:37 still belongs to the 14:00 row.
    const now = new Date(at(14).getTime() + 37 * 60_000);
    const summary = deriveDaySummary(day([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15]), now);

    expect(summary.currentHour?.at).toEqual(at(14));
    expect(summary.currentHour?.nokPerKwh).toBe(14);
  });

  it("returns no current hour when the displayed day does not contain now", () => {
    // Viewing tomorrow: there is no "current" row, and inventing one would mislabel it.
    const summary = deriveDaySummary(day([1, 2, 3]), at(50));

    expect(summary.currentHour).toBeNull();
  });

  it("reports a current hour whose price is missing without dropping the row", () => {
    const summary = deriveDaySummary(day([null, null]), at(1));

    expect(summary.currentHour?.at).toEqual(at(1));
    expect(summary.currentHour?.nokPerKwh).toBeNull();
  });

  it("finds the metric peak independently of price", () => {
    const summary = deriveDaySummary(day([1, 2, 3], [4.4, 9.1, 2.2]), at(0));

    expect(summary.metricPeakHour).toEqual({ at: at(1), value: 9.1 });
  });

  it("handles an empty day", () => {
    const summary = deriveDaySummary(day([]), at(0));

    expect(summary).toEqual({
      currentHour: null,
      averageNokPerKwh: null,
      currentVsAverage: null,
      cheapestHour: null,
      priciestHour: null,
      metricPeakHour: null,
      cheapestWindow: null,
    });
  });
});

describe("deriveEveningComparison", () => {
  const fullDay = (prices: Array<number | null>) => day(prices);

  it("compares 17:00–21:00 against the daily average", () => {
    // 24 hours: 1.0 everywhere except the evening window, which is 2.0.
    const prices = Array.from({ length: 24 }, (_, hour) =>
      hour >= 17 && hour < 22 ? 2 : 1,
    );
    const aligned = fullDay(prices);
    const summary = deriveDaySummary(aligned, at(0));

    const comparison = deriveEveningComparison(aligned, summary);

    expect(comparison?.eveningAverage).toBe(2);
    expect(comparison?.difference).toBeGreaterThan(0);
  });

  it("reports a negative difference when the evening is cheaper", () => {
    const prices = Array.from({ length: 24 }, (_, hour) =>
      hour >= 17 && hour < 22 ? 0.5 : 2,
    );
    const aligned = fullDay(prices);

    const comparison = deriveEveningComparison(aligned, deriveDaySummary(aligned, at(0)));

    expect(comparison?.difference).toBeLessThan(0);
  });

  it("returns null when the evening window has no prices", () => {
    // Better to omit the observation than to compare against nothing.
    const prices = Array.from({ length: 24 }, (_, hour) =>
      hour >= 17 && hour < 22 ? null : 1,
    );
    const aligned = fullDay(prices);

    expect(deriveEveningComparison(aligned, deriveDaySummary(aligned, at(0)))).toBeNull();
  });

  it("returns null when the day has no average at all", () => {
    const aligned = fullDay([]);

    expect(deriveEveningComparison(aligned, deriveDaySummary(aligned, at(0)))).toBeNull();
  });

  it("selects the window by Oslo wall clock, not by array index", () => {
    // The day starts at 22:00Z, so index 17 is 17:00 Oslo. Indexing UTC hours would pick
    // the wrong five rows.
    const prices = Array.from({ length: 24 }, (_, hour) => (hour === 17 ? 10 : 1));
    const aligned = fullDay(prices);

    const comparison = deriveEveningComparison(aligned, deriveDaySummary(aligned, at(0)));

    // Only one of the five evening hours is elevated: (10 + 1 + 1 + 1 + 1) / 5 = 2.8
    expect(comparison?.eveningAverage).toBeCloseTo(2.8, 5);
  });
});

describe("deriveCheapestWindow", () => {
  it("finds the cheapest run of consecutive hours", () => {
    const window = deriveCheapestWindow(day([2, 2, 0.1, 0.2, 0.3, 2]), 3);

    expect(window?.from).toEqual(at(2));
    expect(window?.averageNokPerKwh).toBeCloseTo(0.2, 5);
    expect(window?.hourCount).toBe(3);
  });

  it("ends the window one hour past its last hour", () => {
    // Exclusive end: a 00:00-02:00 window covers three hours and stops at 03:00.
    expect(deriveCheapestWindow(day([1, 1, 1, 9]), 3)?.until).toEqual(at(3));
  });

  it("requires the hours to be consecutive, not merely cheap", () => {
    /*
     * The three cheapest *hours* here are 0, 2 and 4 — but they are scattered, and the
     * question this answers is when to start a machine, which needs a run.
     */
    const window = deriveCheapestWindow(day([0.1, 5, 0.1, 5, 0.1, 5]), 3);

    expect(window?.from).toEqual(at(0));
    expect(window?.averageNokPerKwh).toBeCloseTo(1.733_333, 4);
  });

  it("skips a window containing an hour without a price", () => {
    // Averaging the two hours that exist would silently answer a different question.
    // 00-02 and 01-03 both straddle the gap, so the first eligible run starts at 02:00.
    const window = deriveCheapestWindow(day([0.1, null, 0.1, 2, 2, 2]), 3);

    expect(window?.from).toEqual(at(2));
  });

  it("breaks a tie on the earliest window", () => {
    expect(deriveCheapestWindow(day([1, 1, 1, 1, 1, 1]), 3)?.from).toEqual(at(0));
  });

  it("returns null when the day is shorter than the window", () => {
    expect(deriveCheapestWindow(day([1, 2]), 3)).toBeNull();
  });

  it("returns null when no run of the length has a full set of prices", () => {
    expect(deriveCheapestWindow(day([1, null, 1, null, 1]), 3)).toBeNull();
  });
});

describe("currentVsAverage", () => {
  it("signs the current hour against the daily average", () => {
    // Average of 1, 2 and 3 is 2; the current hour (index 0) is 50 % below it.
    const summary = deriveDaySummary(day([1, 2, 3]), at(0));

    expect(summary.currentVsAverage).toBeCloseTo(-0.5, 5);
  });

  it("is null when the day does not contain the current hour", () => {
    expect(deriveDaySummary(day([1, 2, 3]), at(99)).currentVsAverage).toBeNull();
  });

  it("is null rather than infinite when the average is zero", () => {
    expect(deriveDaySummary(day([0, 0]), at(0)).currentVsAverage).toBeNull();
  });
});

