import { describe, expect, it } from "vitest";
import type { EnergyPrice } from "@/features/energy-prices";
import type { HourlyWeather } from "@/features/weather-forecast";
import { alignPriceAndWeather } from "./align-hours";

/** 2026-08-09T00:00 Europe/Oslo (UTC+2). */
const MIDNIGHT_OSLO = Date.UTC(2026, 7, 8, 22, 0, 0);

const hourAt = (offset: number) => new Date(MIDNIGHT_OSLO + offset * 3_600_000);

function price(offset: number, nokPerKwh: number): EnergyPrice {
  return {
    hourStart: hourAt(offset),
    hourEnd: hourAt(offset + 1),
    nokPerKwh,
  };
}

function weather(
  offsets: number[],
  wind: Array<number | null>,
): HourlyWeather {
  return {
    times: offsets.map(hourAt),
    values: {
      wind,
      temperature: offsets.map(() => null),
      solar: offsets.map(() => null),
    },
  };
}

describe("alignPriceAndWeather", () => {
  it("pairs values that share an hour", () => {
    const result = alignPriceAndWeather(
      [price(0, 0.4), price(1, 0.5), price(2, 0.6)],
      weather([0, 1, 2], [3.1, 4.2, 5.3]),
      "wind",
    );

    expect(result.hours).toHaveLength(3);
    expect(result.nokPerKwh).toEqual([0.4, 0.5, 0.6]);
    expect(result.metricValues).toEqual([3.1, 4.2, 5.3]);
    expect(result.coverage.matchedHours).toBe(3);
  });

  it("joins on the hour, not the array index", () => {
    /*
     * The load-bearing test. Weather is missing its first hour, so weather[0] describes
     * hour 1 while price[0] describes hour 0. An index join would pair 0.4 with 4.2 and
     * produce a plausible, wrong chart. A timestamp join must leave hour 0's weather
     * empty and put 4.2 against hour 1.
     */
    const result = alignPriceAndWeather(
      [price(0, 0.4), price(1, 0.5), price(2, 0.6)],
      weather([1, 2], [4.2, 5.3]),
      "wind",
    );

    expect(result.hours.map((h) => h.toISOString())).toEqual([
      hourAt(0).toISOString(),
      hourAt(1).toISOString(),
      hourAt(2).toISOString(),
    ]);
    expect(result.nokPerKwh).toEqual([0.4, 0.5, 0.6]);
    expect(result.metricValues).toEqual([null, 4.2, 5.3]);
    expect(result.metricValues[0]).not.toBe(4.2);
    expect(result.coverage).toEqual({
      matchedHours: 2,
      priceOnlyHours: 1,
      weatherOnlyHours: 0,
      duplicateHours: 0,
    });
  });

  it("returns the union of both sources, not the intersection", () => {
    // Hour 3 exists only in weather. Dropping it would hide real data behind a shorter
    // chart with no indication anything was missing.
    const result = alignPriceAndWeather(
      [price(0, 0.4)],
      weather([0, 3], [3.1, 9.9]),
      "wind",
    );

    expect(result.hours).toHaveLength(2);
    expect(result.nokPerKwh).toEqual([0.4, null]);
    expect(result.metricValues).toEqual([3.1, 9.9]);
    expect(result.coverage.weatherOnlyHours).toBe(1);
  });

  it("tolerates sources of different lengths and start hours", () => {
    const result = alignPriceAndWeather(
      [price(2, 0.6), price(3, 0.7)],
      weather([0, 1, 2], [1.1, 2.2, 3.3]),
      "wind",
    );

    expect(result.hours).toHaveLength(4);
    expect(result.nokPerKwh).toEqual([null, null, 0.6, 0.7]);
    expect(result.metricValues).toEqual([1.1, 2.2, 3.3, null]);
    expect(result.coverage.priceOnlyHours).toBe(1);
    expect(result.coverage.weatherOnlyHours).toBe(2);
  });

  it("sorts unordered input ascending", () => {
    const result = alignPriceAndWeather(
      [price(2, 0.6), price(0, 0.4), price(1, 0.5)],
      weather([1, 0, 2], [4.2, 3.1, 5.3]),
      "wind",
    );

    expect(result.nokPerKwh).toEqual([0.4, 0.5, 0.6]);
    expect(result.metricValues).toEqual([3.1, 4.2, 5.3]);
  });

  it("keeps gaps as null and never as zero", () => {
    const result = alignPriceAndWeather(
      [price(0, 0.4), price(1, 0.5)],
      weather([0, 1], [null, 4.2]),
      "wind",
    );

    expect(result.metricValues).toEqual([null, 4.2]);
    expect(result.coverage.matchedHours).toBe(1);
    expect(result.coverage.priceOnlyHours).toBe(1);
  });

  it("preserves legitimate zero values on both sides", () => {
    const result = alignPriceAndWeather(
      [price(0, 0), price(1, -0.02)],
      weather([0, 1], [0, 0]),
      "wind",
    );

    expect(result.nokPerKwh).toEqual([0, -0.02]);
    expect(result.metricValues).toEqual([0, 0]);
    // Zero is a value, so both hours count as matched.
    expect(result.coverage.matchedHours).toBe(2);
  });

  it("counts repeated hours and keeps the first occurrence", () => {
    const result = alignPriceAndWeather(
      [price(0, 0.4), price(0, 0.9), price(1, 0.5)],
      weather([0, 1], [3.1, 4.2]),
      "wind",
    );

    expect(result.hours).toHaveLength(2);
    expect(result.nokPerKwh).toEqual([0.4, 0.5]);
    expect(result.coverage.duplicateHours).toBe(1);
  });

  it("selects the requested metric", () => {
    const forecast: HourlyWeather = {
      times: [hourAt(0), hourAt(1)],
      values: {
        wind: [3.1, 4.2],
        temperature: [17.4, 17.9],
        solar: [0, 12],
      },
    };

    expect(alignPriceAndWeather([], forecast, "temperature").metricValues).toEqual([
      17.4, 17.9,
    ]);
    expect(alignPriceAndWeather([], forecast, "solar").metricValues).toEqual([0, 12]);
  });

  it("handles weather being absent entirely, so prices still render", () => {
    // Partial success: a dead weather provider must not take the price experience down.
    const result = alignPriceAndWeather([price(0, 0.4), price(1, 0.5)], null, "wind");

    expect(result.hours).toHaveLength(2);
    expect(result.nokPerKwh).toEqual([0.4, 0.5]);
    expect(result.metricValues).toEqual([null, null]);
    expect(result.coverage.priceOnlyHours).toBe(2);
    expect(result.coverage.matchedHours).toBe(0);
  });

  it("handles a metric that the provider could not supply", () => {
    const result = alignPriceAndWeather(
      [price(0, 0.4)],
      weather([0], [null]),
      "wind",
    );

    expect(result.metricValues).toEqual([null]);
    expect(result.coverage.matchedHours).toBe(0);
  });

  it("returns empty output for empty input rather than throwing", () => {
    const result = alignPriceAndWeather([], null, "wind");

    expect(result.hours).toEqual([]);
    expect(result.nokPerKwh).toEqual([]);
    expect(result.metricValues).toEqual([]);
    expect(result.coverage.matchedHours).toBe(0);
  });

  it("aligns all 25 hours of a DST fall-back day", () => {
    // 2026-10-25 Europe/Oslo: the clock shows 02:00 twice, but the two hours are
    // distinct instants an hour apart, so they must stay distinct rows.
    const dstStart = Date.UTC(2026, 9, 24, 22, 0, 0);
    const at = (i: number) => new Date(dstStart + i * 3_600_000);

    const prices: EnergyPrice[] = Array.from({ length: 25 }, (_, i) => ({
      hourStart: at(i),
      hourEnd: at(i + 1),
      nokPerKwh: i / 100,
    }));

    const forecast: HourlyWeather = {
      times: Array.from({ length: 25 }, (_, i) => at(i)),
      values: {
        wind: Array.from({ length: 25 }, (_, i) => i),
        temperature: Array.from({ length: 25 }, () => null),
        solar: Array.from({ length: 25 }, () => null),
      },
    };

    const result = alignPriceAndWeather(prices, forecast, "wind");

    expect(result.hours).toHaveLength(25);
    expect(result.coverage.matchedHours).toBe(25);
    expect(result.coverage.duplicateHours).toBe(0);
    // The two 02:00 rows are an hour apart, not collapsed into one.
    expect(result.hours[3].toISOString()).toBe("2026-10-25T01:00:00.000Z");
    expect(result.hours[4].toISOString()).toBe("2026-10-25T02:00:00.000Z");
  });

  it("aligns the 23-hour spring-forward day", () => {
    // 2026-03-29 Europe/Oslo: 02:00 never happens. 23 hours is correct, not an error.
    const springStart = Date.UTC(2026, 2, 28, 23, 0, 0);
    const at = (i: number) => new Date(springStart + i * 3_600_000);

    const prices: EnergyPrice[] = Array.from({ length: 23 }, (_, i) => ({
      hourStart: at(i),
      hourEnd: at(i + 1),
      nokPerKwh: i / 100,
    }));

    const result = alignPriceAndWeather(prices, null, "wind");

    expect(result.hours).toHaveLength(23);
    expect(result.coverage.priceOnlyHours).toBe(23);
  });

  it("ignores an invalid timestamp rather than producing a NaN key", () => {
    const result = alignPriceAndWeather(
      [
        { hourStart: new Date("nonsense"), hourEnd: hourAt(1), nokPerKwh: 0.9 },
        price(0, 0.4),
      ],
      null,
      "wind",
    );

    expect(result.hours).toHaveLength(1);
    expect(result.nokPerKwh).toEqual([0.4]);
  });
});
