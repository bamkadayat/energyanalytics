import { TZDate } from "@date-fns/tz";
import {
  APP_TIME_ZONE,
  TOMORROW_PRICES_PUBLISHED_HOUR,
  type DaySelection,
} from "@/shared/config";

/**
 * Calendar date as it reads on a wall clock in APP_TIME_ZONE.
 *
 * `month` is 1-based, unlike JavaScript's Date — this type is used to build API paths
 * and labels, where a 0-based month is a reliable source of off-by-one bugs.
 */
export interface OsloDay {
  year: number;
  /** 1–12. */
  month: number;
  /** 1–31. */
  day: number;
}

/**
 * Every zone-aware operation in the app goes through this module.
 *
 * The point is that nothing anywhere else may call `new Date()` on a naive string, read
 * `getHours()` off a plain Date, or assume a day is 24 hours long. All three quietly
 * depend on the *server's* local zone, which is not Europe/Oslo in any deployment we
 * control.
 *
 * Every function takes the current instant as an argument rather than reading a clock,
 * so behaviour is reproducible in tests.
 */

/** The calendar date an instant falls on, in Oslo. */
export function osloDayOf(instant: Date): OsloDay {
  const zoned = new TZDate(instant, APP_TIME_ZONE);
  return {
    year: zoned.getFullYear(),
    month: zoned.getMonth() + 1,
    day: zoned.getDate(),
  };
}

/** The hour of day (0–23) an instant falls in, in Oslo. */
export function osloHourOf(instant: Date): number {
  return new TZDate(instant, APP_TIME_ZONE).getHours();
}

/**
 * Resolves "today" or "tomorrow" against the given instant.
 *
 * Day arithmetic happens on the calendar date, not by adding 86 400 000 ms: across a DST
 * transition a day is 23 or 25 hours, so millisecond arithmetic lands on the wrong date
 * twice a year. Out-of-range days normalise (31 Dec + 1 → 1 Jan of the next year).
 */
export function resolveOsloDay(now: Date, selection: DaySelection): OsloDay {
  const today = osloDayOf(now);
  if (selection === "today") {
    return today;
  }

  // Midday avoids any ambiguity around a transition before normalising.
  const tomorrow = new TZDate(
    today.year,
    today.month - 1,
    today.day + 1,
    12,
    0,
    0,
    APP_TIME_ZONE,
  );

  return {
    year: tomorrow.getFullYear(),
    month: tomorrow.getMonth() + 1,
    day: tomorrow.getDate(),
  };
}

/**
 * Absolute instants bounding an Oslo calendar day: `start` inclusive, `end` exclusive.
 *
 * The span is 23, 24 or 25 hours depending on DST. Callers must filter with these
 * instants rather than assuming a fixed hour count.
 */
export function osloDayBounds(day: OsloDay): { start: Date; end: Date } {
  const start = new TZDate(day.year, day.month - 1, day.day, 0, 0, 0, APP_TIME_ZONE);
  const end = new TZDate(day.year, day.month - 1, day.day + 1, 0, 0, 0, APP_TIME_ZONE);

  return { start: new Date(start.getTime()), end: new Date(end.getTime()) };
}

/**
 * Path segment for the price API: `{YYYY}/{MM-DD}`, zero-padded.
 *
 * Built from Oslo calendar parts, never from `toISOString()` — that would emit the UTC
 * date, which is the previous day for every Oslo hour between midnight and 01:00 or
 * 02:00, and would silently request the wrong day's prices.
 */
export function pricePathFor(day: OsloDay): string {
  const month = String(day.month).padStart(2, "0");
  const dayOfMonth = String(day.day).padStart(2, "0");
  return `${day.year}/${month}-${dayOfMonth}`;
}

/**
 * Whether tomorrow's day-ahead prices should exist yet.
 *
 * Before publication the provider answers 404. That is a normal state, not a failure,
 * and this predicate is what lets the caller tell "not published yet" from "the provider
 * is broken" — they need different UI and different cache lifetimes.
 */
export function areTomorrowPricesExpected(now: Date): boolean {
  return osloHourOf(now) >= TOMORROW_PRICES_PUBLISHED_HOUR;
}
