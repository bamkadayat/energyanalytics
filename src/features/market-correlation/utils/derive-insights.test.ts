import { describe, expect, it } from "vitest";
import type { AlignedHours } from "../types";
import { deriveDaySummary } from "./derive-summary";
import { deriveInsights } from "./derive-insights";

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

function insightsFor(aligned: AlignedHours) {
  return deriveInsights(aligned, deriveDaySummary(aligned, at(0)));
}

describe("deriveInsights", () => {
  it("states the cheapest and most expensive hours", () => {
    const texts = insightsFor(day([1.2, 0.4, 2.5])).map((i) => i.text);

    expect(texts.join(" ")).toMatch(/cheapest hour is 01:00/i);
    expect(texts.join(" ")).toMatch(/most expensive hour is 02:00/i);
  });

  it("always states a unit alongside a number", () => {
    // This app carries three units across two axes; a bare figure is a domain bug.
    const aligned = day(
      Array.from({ length: 24 }, () => 1),
      Array.from({ length: 24 }, (_, hour) => hour),
    );

    for (const insight of insightsFor(aligned)) {
      expect(insight.text).toMatch(/NOK\/kWh|m\/s/);
    }
  });

  it("never uses causal language", () => {
    /*
     * The load-bearing test for this module. The project may show that price and weather
     * move together; it must never claim one causes the other. If someone later writes
     * "prices are low because it is windy", this fails.
     */
    const aligned = day(
      Array.from({ length: 24 }, (_, hour) => (hour >= 17 && hour < 22 ? 2 : 1)),
      Array.from({ length: 24 }, (_, hour) => hour),
    );

    const combined = insightsFor(aligned)
      .map((insight) => insight.text)
      .join(" ")
      .toLowerCase();

    for (const word of [
      "because",
      "due to",
      "caused",
      "causes",
      "driven by",
      "drives",
      "leads to",
      "results in",
      "thanks to",
      "explains",
      "correlat",
    ]) {
      expect(combined).not.toContain(word);
    }
  });

  it("compares the evening to the daily average without asserting a reason", () => {
    const aligned = day(
      Array.from({ length: 24 }, (_, hour) => (hour >= 17 && hour < 22 ? 2 : 1)),
    );

    const evening = insightsFor(aligned).find((i) => i.id === "evening");

    expect(evening?.text).toMatch(/evening hours/i);
    expect(evening?.text).toMatch(/above the daily average/i);
  });

  it("says below when the evening is cheaper", () => {
    const aligned = day(
      Array.from({ length: 24 }, (_, hour) => (hour >= 17 && hour < 22 ? 0.5 : 2)),
    );

    expect(insightsFor(aligned).find((i) => i.id === "evening")?.text).toMatch(
      /below the daily average/i,
    );
  });

  it("reports the metric peak with its own label and unit", () => {
    const aligned = day([1, 2, 3], [4.4, 9.1, 2.2]);

    expect(insightsFor(aligned).find((i) => i.id === "metric-peak")?.text).toMatch(
      /wind speed peaks at 01:00 at 9,1 m\/s/i,
    );
  });

  it("omits an observation rather than hedging when its inputs are missing", () => {
    // No weather at all: three price observations, and nothing claiming an unknown peak.
    const aligned = day(Array.from({ length: 24 }, () => 1));
    const ids = insightsFor(aligned).map((i) => i.id);

    expect(ids).not.toContain("metric-peak");
    expect(ids).toContain("cheapest");
  });

  it("returns nothing at all for an empty day", () => {
    expect(insightsFor(day([]))).toEqual([]);
  });

  it("gives every observation a stable id", () => {
    const aligned = day([1, 2, 3], [1, 2, 3]);
    const ids = insightsFor(aligned).map((i) => i.id);

    expect(new Set(ids).size).toBe(ids.length);
  });
});
