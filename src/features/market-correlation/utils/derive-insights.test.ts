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
    const insights = insightsFor(day([1.2, 0.4, 2.5]));

    expect(insights.find((i) => i.id === "cheapest")?.hour).toBe("01:00");
    expect(insights.find((i) => i.id === "priciest")?.hour).toBe("02:00");
  });

  it("carries the hour in its own field rather than inside the sentence", () => {
    // The chip renders `hour`; a time left in the prose would print twice.
    const insights = insightsFor(day([1.2, 0.4, 2.5], [1, 2, 3]));

    for (const insight of insights) {
      expect(insight.text).not.toMatch(/\d{2}:\d{2}/);
    }
  });

  it("compares each extreme to the daily average", () => {
    const cheapest = insightsFor(day([2, 1, 3])).find((i) => i.id === "cheapest");

    // Average of 2, 1 and 3 is 2, so the cheapest hour is 50 % below it.
    expect(cheapest?.text).toMatch(/50 % below the daily average/);
  });

  it("drops the comparison rather than dividing by a zero average", () => {
    const cheapest = insightsFor(day([0, 0, 0])).find((i) => i.id === "cheapest");

    expect(cheapest?.text).not.toMatch(/average/);
    expect(cheapest?.text).toMatch(/NOK\/kWh/);
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

  it("never states an evening comparison", () => {
    // Removed 2026-08-14. `deriveEveningComparison` still exists for other callers, so
    // this pins that the list does not reach for it again.
    const aligned = day(
      Array.from({ length: 24 }, (_, hour) => (hour >= 17 && hour < 22 ? 2 : 1)),
    );
    const combined = insightsFor(aligned)
      .map((i) => i.text)
      .join(" ");

    expect(insightsFor(aligned).map((i) => i.id)).not.toContain("evening");
    expect(combined).not.toMatch(/evening/i);
  });

  it("reports the metric peak with its own label and unit", () => {
    // No prices, so the peak is not crowded out by the two price observations.
    const aligned = day([null, null, null], [4.4, 9.1, 2.2]);

    expect(insightsFor(aligned).find((i) => i.id === "metric-peak")?.hour).toBe("01:00");
    expect(insightsFor(aligned).find((i) => i.id === "metric-peak")?.text).toMatch(
      /wind speed peaks at 9\.1 m\/s/i,
    );
  });

  it("omits an observation rather than hedging when its inputs are missing", () => {
    // No weather at all: three price observations, and nothing claiming an unknown peak.
    const aligned = day(Array.from({ length: 24 }, () => 1));
    const ids = insightsFor(aligned).map((i) => i.id);

    expect(ids).not.toContain("metric-peak");
    expect(ids).toContain("cheapest");
  });

  it("stops at two, dropping the peak the KPI strip already states", () => {
    // A full day produces three candidates: cheapest, priciest, metric peak.
    const aligned = day(
      Array.from({ length: 24 }, (_, hour) => (hour >= 17 && hour < 22 ? 2 : 1)),
      Array.from({ length: 24 }, (_, hour) => hour),
    );

    const ids = insightsFor(aligned).map((i) => i.id);

    expect(ids).toEqual(["cheapest", "priciest"]);
  });

  it("keeps the peak when the price observations are missing", () => {
    // The cap drops the peak only when there are two price observations ahead of it.
    // With none, it fills the space rather than leaving the section empty.
    const aligned = day([null, null, null], [4.4, 9.1, 2.2]);

    expect(insightsFor(aligned).map((i) => i.id)).toEqual(["metric-peak"]);
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
