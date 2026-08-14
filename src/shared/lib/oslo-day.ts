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
 * Every zone-aware operation goes through here: nothing elsewhere may parse a naive
 * string, read `getHours()` off a plain Date, or assume a 24-hour day. Functions take the
 * instant as an argument rather than reading a clock, so tests are reproducible.
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
 * Resolves "today" or "tomorrow". Arithmetic is on the calendar date, never on
 * milliseconds — a DST day is 23 or 25 hours, so ms arithmetic lands on the wrong date
 * twice a year. Out-of-range days normalise (31 Dec + 1 → 1 Jan).
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
 * Path segment for the price API: `{YYYY}/{MM-DD}`, zero-padded. From Oslo calendar
 * parts, never `toISOString()` — that emits the UTC date, a day earlier for every Oslo
 * hour before 01:00, and would silently request the wrong day.
 */
export function pricePathFor(day: OsloDay): string {
  const { month, dayOfMonth } = padded(day);
  return `${day.year}/${month}-${dayOfMonth}`;
}

/**
 * `YYYY-MM-DD` for APIs that take a calendar date, such as Open-Meteo's
 * `start_date`/`end_date`. Same reasoning as `pricePathFor`: built from Oslo parts, not
 * from `toISOString()`.
 */
export function isoDateFor(day: OsloDay): string {
  const { month, dayOfMonth } = padded(day);
  return `${day.year}-${month}-${dayOfMonth}`;
}

function padded(day: OsloDay): { month: string; dayOfMonth: string } {
  return {
    month: String(day.month).padStart(2, "0"),
    dayOfMonth: String(day.day).padStart(2, "0"),
  };
}

/**
 * The `count` Oslo days ending with `now`, oldest first. Walks the calendar rather than
 * subtracting milliseconds, for the reason `resolveOsloDay` gives.
 */
export function osloDaysBack(now: Date, count: number): OsloDay[] {
  const today = osloDayOf(now);
  const days: OsloDay[] = [];

  for (let offset = count - 1; offset >= 0; offset -= 1) {
    const zoned = new TZDate(
      today.year,
      today.month - 1,
      today.day - offset,
      12,
      0,
      0,
      APP_TIME_ZONE,
    );
    days.push({
      year: zoned.getFullYear(),
      month: zoned.getMonth() + 1,
      day: zoned.getDate(),
    });
  }

  return days;
}

/**
 * Whether tomorrow's prices should exist yet. Before publication the provider 404s, which
 * is normal — this is what lets the caller tell that from a broken provider, and the two
 * need different UI and different cache lifetimes.
 */
export function areTomorrowPricesExpected(now: Date): boolean {
  return osloHourOf(now) >= TOMORROW_PRICES_PUBLISHED_HOUR;
}
