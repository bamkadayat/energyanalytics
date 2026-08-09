import { describe, expect, it } from "vitest";
import {
  formatOsloDate,
  formatOsloDateTime,
  formatOsloTime,
  toDateTimeAttribute,
} from "./format-oslo";

describe("formatOsloTime", () => {
  it("prints the Oslo wall clock, not UTC", () => {
    // 10:00 UTC is 12:00 in Oslo in summer.
    expect(formatOsloTime(new Date("2026-08-09T10:00:00Z"))).toBe("12:00");
  });

  it("uses the winter offset in winter", () => {
    expect(formatOsloTime(new Date("2026-01-09T10:00:00Z"))).toBe("11:00");
  });

  it("does not depend on the runtime timezone", () => {
    // The formatter pins timeZone explicitly, so this holds wherever it runs. If it ever
    // starts failing on CI but passing locally, an unpinned formatter has crept in.
    const midnightOslo = new Date("2026-08-08T22:00:00Z");
    expect(formatOsloTime(midnightOslo)).toBe("00:00");
  });

  it("shows both hours of the DST fall-back day as 02:00", () => {
    // The clock genuinely reads 02:00 twice; they are distinct instants an hour apart.
    expect(formatOsloTime(new Date("2026-10-25T00:30:00Z"))).toBe("02:30");
    expect(formatOsloTime(new Date("2026-10-25T01:30:00Z"))).toBe("02:30");
  });
});

describe("formatOsloDate", () => {
  it("formats a calendar day", () => {
    const formatted = formatOsloDate({ year: 2026, month: 8, day: 9 });

    expect(formatted).toContain("2026");
    expect(formatted).toMatch(/9/);
  });

  it("names the day the user selected, not the UTC one", () => {
    // The day starts at 22:00Z the previous evening; formatting that instant must still
    // report the 9th.
    expect(formatOsloDate({ year: 2026, month: 8, day: 9 })).toMatch(/\b9\b/);
  });

  it("handles both DST transition days", () => {
    expect(formatOsloDate({ year: 2026, month: 10, day: 25 })).toMatch(/25/);
    expect(formatOsloDate({ year: 2026, month: 3, day: 29 })).toMatch(/29/);
  });
});

describe("formatOsloDateTime", () => {
  it("includes both date and Oslo time", () => {
    const formatted = formatOsloDateTime(new Date("2026-08-09T10:32:00Z"));

    expect(formatted).toMatch(/12[:.]32/);
    expect(formatted).toMatch(/9/);
  });
});

describe("toDateTimeAttribute", () => {
  it("emits an unambiguous machine-readable instant", () => {
    expect(toDateTimeAttribute(new Date("2026-08-09T10:00:00Z"))).toBe(
      "2026-08-09T10:00:00.000Z",
    );
  });
});
