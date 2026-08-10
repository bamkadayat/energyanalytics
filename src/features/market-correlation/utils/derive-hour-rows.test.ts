import { describe, expect, it } from "vitest";
import type { EnergyPrice } from "@/features/energy-prices";
import type { HourlyWeather } from "@/features/weather-forecast";
import { deriveHourRows } from "./derive-hour-rows";

/** 2026-08-09T00:00 Europe/Oslo. */
const MIDNIGHT_OSLO = Date.UTC(2026, 7, 8, 22, 0, 0);
const at = (hour: number) => new Date(MIDNIGHT_OSLO + hour * 3_600_000);

const label = (date: Date) => date.toISOString();

function prices(values: Array<[hour: number, price: number]>): EnergyPrice[] {
  return values.map(([hour, nokPerKwh]) => ({
    hourStart: at(hour),
    nokPerKwh,
  })) as EnergyPrice[];
}

function weather(
  hours: number[],
  values: Partial<{
    wind: Array<number | null>;
    temperature: Array<number | null>;
    solar: Array<number | null>;
  }> = {},
): HourlyWeather {
  const blank = hours.map(() => null);

  return {
    times: hours.map(at),
    values: {
      wind: values.wind ?? blank,
      temperature: values.temperature ?? blank,
      solar: values.solar ?? blank,
    },
  };
}

describe("deriveHourRows", () => {
  it("pairs a price with the weather from the same hour, not the same index", () => {
    // Weather starts two hours before the prices do. Index pairing would attach the
    // 00:00 reading to the 02:00 price, which is the bug this join exists to prevent.
    const rows = deriveHourRows(
      prices([
        [2, 1.5],
        [3, 1.7],
      ]),
      weather([0, 1, 2, 3], { wind: [9, 9, 4, 5] }),
      label,
    );

    const priced = rows.filter((row) => row.price !== null);

    expect(priced).toHaveLength(2);
    expect(priced[0]).toMatchObject({ price: 1.5, wind: 4 });
    expect(priced[1]).toMatchObject({ price: 1.7, wind: 5 });
  });

  it("returns the union of both sources, ascending", () => {
    const rows = deriveHourRows(prices([[5, 1]]), weather([0, 1]), label);

    expect(rows.map((row) => row.at)).toEqual([
      at(0).getTime(),
      at(1).getTime(),
      at(5).getTime(),
    ]);
  });

  it("carries all three metrics for one hour", () => {
    const rows = deriveHourRows(
      prices([[0, 0.5]]),
      weather([0], { wind: [3], temperature: [18], solar: [420] }),
      label,
    );

    expect(rows[0]).toMatchObject({
      price: 0.5,
      wind: 3,
      temperature: 18,
      solar: 420,
    });
  });

  it("keeps a missing reading null rather than zero", () => {
    const rows = deriveHourRows(
      prices([[0, 0.5]]),
      weather([0], { wind: [null], temperature: [0] }),
      label,
    );

    // Zero degrees is a reading; a missing wind speed is not a still hour.
    expect(rows[0].wind).toBeNull();
    expect(rows[0].temperature).toBe(0);
  });

  it("keeps the first of a duplicated hour", () => {
    const rows = deriveHourRows(
      prices([
        [0, 1],
        [0, 99],
      ]),
      null,
      label,
    );

    expect(rows).toHaveLength(1);
    expect(rows[0].price).toBe(1);
  });

  it("survives weather with no prices at all", () => {
    const rows = deriveHourRows([], weather([0, 1], { wind: [2, 3] }), label);

    expect(rows).toHaveLength(2);
    expect(rows.every((row) => row.price === null)).toBe(true);
  });

  it("labels every row through the formatter it is given", () => {
    const rows = deriveHourRows(prices([[0, 1]]), null, () => "formatted");

    expect(rows[0].label).toBe("formatted");
  });
});
