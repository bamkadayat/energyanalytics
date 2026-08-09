import { APP_LOCALE, APP_TIME_ZONE } from "@/shared/config";
import { osloDayBounds, type OsloDay } from "./oslo-day";

/**
 * All user-facing date and time formatting.
 *
 * Every formatter pins `timeZone` explicitly. `Intl` defaults to the *runtime's* zone,
 * so an unpinned formatter would print Oslo data in whatever zone the server happens to
 * run in — the same class of bug as parsing a naive timestamp, just at the other end of
 * the pipeline.
 *
 * Formatters are constructed once: `Intl.DateTimeFormat` is comparatively expensive, and
 * these run per hour of the day in the table and axis labels.
 */

const timeFormatter = new Intl.DateTimeFormat(APP_LOCALE, {
  hour: "2-digit",
  minute: "2-digit",
  timeZone: APP_TIME_ZONE,
});

const dateFormatter = new Intl.DateTimeFormat(APP_LOCALE, {
  weekday: "long",
  day: "numeric",
  month: "long",
  year: "numeric",
  timeZone: APP_TIME_ZONE,
});

const dateTimeFormatter = new Intl.DateTimeFormat(APP_LOCALE, {
  day: "numeric",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
  timeZone: APP_TIME_ZONE,
});

/** Wall-clock time in Oslo, e.g. `14:00`. */
export function formatOsloTime(instant: Date): string {
  return timeFormatter.format(instant);
}

/** Full date of an Oslo calendar day, e.g. `søndag 9. august 2026`. */
export function formatOsloDate(day: OsloDay): string {
  // Format the day's first instant rather than reconstructing a Date from parts, so the
  // day's own DST offset is applied.
  return dateFormatter.format(osloDayBounds(day).start);
}

/** Date and time together, for provenance lines. */
export function formatOsloDateTime(instant: Date): string {
  return dateTimeFormatter.format(instant);
}

/** Machine-readable value for a `<time dateTime>` attribute. */
export function toDateTimeAttribute(instant: Date): string {
  return instant.toISOString();
}
