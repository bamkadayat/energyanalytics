import { describe, expect, it } from "vitest";
import {
  areTomorrowPricesExpected,
  osloDayBounds,
  osloDayOf,
  osloHourOf,
  pricePathFor,
  resolveOsloDay,
} from "./oslo-day";

describe("osloDayOf", () => {
  it("reads the Oslo calendar date, not the UTC one", () => {
    // 22:30 UTC in summer is 00:30 the *next* day in Oslo (UTC+2). Using the UTC date
    // here would request the previous day's prices every night.
    expect(osloDayOf(new Date("2026-08-09T22:30:00Z"))).toEqual({
      year: 2026,
      month: 8,
      day: 10,
    });
  });

  it("handles the winter offset", () => {
    // Oslo is UTC+1 in January, so 23:30 UTC is 00:30 the next day.
    expect(osloDayOf(new Date("2026-01-09T23:30:00Z"))).toEqual({
      year: 2026,
      month: 1,
      day: 10,
    });
    // ...but 22:30 UTC is still 23:30 the same day.
    expect(osloDayOf(new Date("2026-01-09T22:30:00Z"))).toEqual({
      year: 2026,
      month: 1,
      day: 9,
    });
  });

  it("uses a 1-based month", () => {
    expect(osloDayOf(new Date("2026-01-15T12:00:00Z")).month).toBe(1);
    expect(osloDayOf(new Date("2026-12-15T12:00:00Z")).month).toBe(12);
  });
});

describe("osloHourOf", () => {
  it("returns the Oslo wall-clock hour", () => {
    expect(osloHourOf(new Date("2026-08-09T10:00:00Z"))).toBe(12); // UTC+2
    expect(osloHourOf(new Date("2026-01-09T10:00:00Z"))).toBe(11); // UTC+1
  });
});

describe("resolveOsloDay", () => {
  const noon = new Date("2026-08-09T10:00:00Z");

  it("resolves today", () => {
    expect(resolveOsloDay(noon, "today")).toEqual({ year: 2026, month: 8, day: 9 });
  });

  it("resolves tomorrow", () => {
    expect(resolveOsloDay(noon, "tomorrow")).toEqual({ year: 2026, month: 8, day: 10 });
  });

  it("rolls over the end of a month", () => {
    expect(resolveOsloDay(new Date("2026-08-31T10:00:00Z"), "tomorrow")).toEqual({
      year: 2026,
      month: 9,
      day: 1,
    });
  });

  it("rolls over the end of a year", () => {
    expect(resolveOsloDay(new Date("2026-12-31T10:00:00Z"), "tomorrow")).toEqual({
      year: 2027,
      month: 1,
      day: 1,
    });
  });

  it("crosses the DST fall-back boundary by calendar date, not by adding 24 hours", () => {
    // 2026-10-25 is 25 hours long. Adding 86_400_000 ms from midnight would land at
    // 23:00 on the 25th and resolve "tomorrow" to the 25th again.
    expect(resolveOsloDay(new Date("2026-10-24T12:00:00Z"), "tomorrow")).toEqual({
      year: 2026,
      month: 10,
      day: 25,
    });
    expect(resolveOsloDay(new Date("2026-10-25T12:00:00Z"), "tomorrow")).toEqual({
      year: 2026,
      month: 10,
      day: 26,
    });
  });

  it("crosses the DST spring-forward boundary", () => {
    // 2026-03-29 is 23 hours long.
    expect(resolveOsloDay(new Date("2026-03-28T12:00:00Z"), "tomorrow")).toEqual({
      year: 2026,
      month: 3,
      day: 29,
    });
    expect(resolveOsloDay(new Date("2026-03-29T12:00:00Z"), "tomorrow")).toEqual({
      year: 2026,
      month: 3,
      day: 30,
    });
  });

  it("resolves tomorrow correctly late at night, when Oslo is already a day ahead of UTC", () => {
    // 22:30 UTC on the 9th is 00:30 on the 10th in Oslo, so "tomorrow" is the 11th.
    expect(resolveOsloDay(new Date("2026-08-09T22:30:00Z"), "tomorrow")).toEqual({
      year: 2026,
      month: 8,
      day: 11,
    });
  });
});

describe("osloDayBounds", () => {
  const hours = (day: { year: number; month: number; day: number }) => {
    const { start, end } = osloDayBounds(day);
    return (end.getTime() - start.getTime()) / 3_600_000;
  };

  it("spans 24 hours on an ordinary day", () => {
    expect(hours({ year: 2026, month: 8, day: 9 })).toBe(24);
  });

  it("spans 25 hours on the DST fall-back day", () => {
    expect(hours({ year: 2026, month: 10, day: 25 })).toBe(25);
  });

  it("spans 23 hours on the DST spring-forward day", () => {
    expect(hours({ year: 2026, month: 3, day: 29 })).toBe(23);
  });

  it("starts at Oslo midnight, not UTC midnight", () => {
    const { start } = osloDayBounds({ year: 2026, month: 8, day: 9 });
    expect(start.toISOString()).toBe("2026-08-08T22:00:00.000Z");
  });

  it("uses the winter offset in winter", () => {
    const { start } = osloDayBounds({ year: 2026, month: 1, day: 9 });
    expect(start.toISOString()).toBe("2026-01-08T23:00:00.000Z");
  });

  it("ends exclusively, at the start of the next day", () => {
    const { end } = osloDayBounds({ year: 2026, month: 8, day: 9 });
    const nextStart = osloDayBounds({ year: 2026, month: 8, day: 10 }).start;
    expect(end.getTime()).toBe(nextStart.getTime());
  });
});

describe("pricePathFor", () => {
  it("zero-pads month and day", () => {
    expect(pricePathFor({ year: 2026, month: 8, day: 9 })).toBe("2026/08-09");
    expect(pricePathFor({ year: 2026, month: 12, day: 31 })).toBe("2026/12-31");
  });

  it("uses the Oslo date even when UTC is still on the previous day", () => {
    // Verified against the live API: /api/v1/prices/2026/08-09_NO1.json
    const day = osloDayOf(new Date("2026-08-08T22:30:00Z"));
    expect(pricePathFor(day)).toBe("2026/08-09");
  });
});

describe("areTomorrowPricesExpected", () => {
  it("is false before the publication hour in Oslo", () => {
    // 10:00 UTC is 12:00 Oslo in summer — still an hour early.
    expect(areTomorrowPricesExpected(new Date("2026-08-09T10:00:00Z"))).toBe(false);
  });

  it("is true from the publication hour onwards", () => {
    expect(areTomorrowPricesExpected(new Date("2026-08-09T11:00:00Z"))).toBe(true);
    expect(areTomorrowPricesExpected(new Date("2026-08-09T20:00:00Z"))).toBe(true);
  });

  it("uses Oslo time rather than UTC, so the threshold shifts with the season", () => {
    // The same UTC instant falls on either side of the threshold depending on the
    // season: Oslo is UTC+2 in summer and UTC+1 in winter. Comparing against UTC would
    // get one of these two wrong for half the year.
    expect(areTomorrowPricesExpected(new Date("2026-08-09T11:30:00Z"))).toBe(true); // 13:30 Oslo
    expect(areTomorrowPricesExpected(new Date("2026-01-09T11:30:00Z"))).toBe(false); // 12:30 Oslo
  });
});
