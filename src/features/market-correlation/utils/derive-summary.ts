import { osloHourOf } from "@/shared/lib/oslo-day";
import type { AlignedHours } from "../types";

/**
 * Everything the cards, insights and table report is derived here, from the one aligned
 * dataset the chart also uses. Deriving any of it a second way is how a card ends up
 * disagreeing with the graph beside it.
 *
 * Pure and clock-injected.
 */

export interface HourValue {
  at: Date;
  value: number;
}

export interface DaySummary {
  /** The hour containing `now`, if the displayed day contains it at all. */
  currentHour: {
    at: Date;
    nokPerKwh: number | null;
    metricValue: number | null;
  } | null;
  /** Mean of the hours that have a price. Null when none do. */
  averageNokPerKwh: number | null;
  cheapestHour: HourValue | null;
  priciestHour: HourValue | null;
  metricPeakHour: HourValue | null;
}

/** Evening window, in Oslo wall-clock hours: 17:00 up to but not including 22:00. */
const EVENING_FROM = 17;
const EVENING_UNTIL = 22;

export function deriveDaySummary(aligned: AlignedHours, now: Date): DaySummary {
  const currentIndex = aligned.hours.findIndex(
    (hour) => Math.abs(hour.getTime() - floorToHour(now)) < 1,
  );

  return {
    currentHour:
      currentIndex === -1
        ? null
        : {
            at: aligned.hours[currentIndex],
            nokPerKwh: aligned.nokPerKwh[currentIndex] ?? null,
            metricValue: aligned.metricValues[currentIndex] ?? null,
          },
    averageNokPerKwh: mean(aligned.nokPerKwh),
    cheapestHour: extreme(aligned.hours, aligned.nokPerKwh, "min"),
    priciestHour: extreme(aligned.hours, aligned.nokPerKwh, "max"),
    metricPeakHour: extreme(aligned.hours, aligned.metricValues, "max"),
  };
}

export interface EveningComparison {
  eveningAverage: number;
  dayAverage: number;
  /** Signed fraction: +0.12 means the evening is 12 % above the daily average. */
  difference: number;
}

/**
 * The evening window against the daily average.
 *
 * Returns null unless the window has prices *and* the day has an average, so the UI can
 * omit the observation entirely rather than printing a comparison against nothing.
 */
export function deriveEveningComparison(
  aligned: AlignedHours,
  summary: DaySummary,
): EveningComparison | null {
  const dayAverage = summary.averageNokPerKwh;
  if (dayAverage === null || dayAverage === 0) {
    return null;
  }

  const eveningPrices = aligned.hours
    .map((hour, index) => ({ hour, price: aligned.nokPerKwh[index] ?? null }))
    .filter(({ hour }) => {
      const osloHour = osloHourOf(hour);
      return osloHour >= EVENING_FROM && osloHour < EVENING_UNTIL;
    })
    .map(({ price }) => price);

  const eveningAverage = mean(eveningPrices);
  if (eveningAverage === null) {
    return null;
  }

  return {
    eveningAverage,
    dayAverage,
    difference: (eveningAverage - dayAverage) / dayAverage,
  };
}

function floorToHour(instant: Date): number {
  return Math.floor(instant.getTime() / 3_600_000) * 3_600_000;
}

function mean(values: ReadonlyArray<number | null>): number | null {
  const present = values.filter((value): value is number => value !== null);
  if (present.length === 0) {
    return null;
  }

  return present.reduce((total, value) => total + value, 0) / present.length;
}

/**
 * First occurrence wins on a tie, so the result is stable and reads as "the earliest
 * cheapest hour" rather than flipping between equal hours.
 */
function extreme(
  hours: readonly Date[],
  values: ReadonlyArray<number | null>,
  kind: "min" | "max",
): HourValue | null {
  let best: HourValue | null = null;

  for (const [index, value] of values.entries()) {
    if (value === null || hours[index] === undefined) {
      continue;
    }

    if (
      best === null ||
      (kind === "min" ? value < best.value : value > best.value)
    ) {
      best = { at: hours[index], value };
    }
  }

  return best;
}
