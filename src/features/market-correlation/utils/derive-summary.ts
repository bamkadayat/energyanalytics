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

/** A run of consecutive hours, every one of which has a price. */
export interface PriceWindow {
  from: Date;
  /** Exclusive: the instant the window ends, one hour past its last hour. */
  until: Date;
  averageNokPerKwh: number;
  hourCount: number;
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
  /**
   * The current hour against the daily average, as a signed fraction: -0.47 means the
   * current hour is 47 % below it. Null unless both figures exist and the average is
   * non-zero, so the UI omits the comparison instead of dividing by nothing.
   */
  currentVsAverage: number | null;
  cheapestHour: HourValue | null;
  priciestHour: HourValue | null;
  metricPeakHour: HourValue | null;
  cheapestWindow: PriceWindow | null;
}

/** Evening window, in Oslo wall-clock hours: 17:00 up to but not including 22:00. */
export const EVENING_FROM = 17;
export const EVENING_UNTIL = 22;

/**
 * Length of the cheapest-run window. Three hours is roughly a dishwasher or a wash cycle
 * — long enough to be a real decision, short enough that most days contain a clear one.
 */
export const CHEAPEST_WINDOW_HOURS = 3;

export function deriveDaySummary(aligned: AlignedHours, now: Date): DaySummary {
  const currentIndex = aligned.hours.findIndex(
    (hour) => Math.abs(hour.getTime() - floorToHour(now)) < 1,
  );

  const currentHour =
    currentIndex === -1
      ? null
      : {
          at: aligned.hours[currentIndex],
          nokPerKwh: aligned.nokPerKwh[currentIndex] ?? null,
          metricValue: aligned.metricValues[currentIndex] ?? null,
        };

  const averageNokPerKwh = mean(aligned.nokPerKwh);

  return {
    currentHour,
    averageNokPerKwh,
    currentVsAverage: ratioAgainst(currentHour?.nokPerKwh ?? null, averageNokPerKwh),
    cheapestHour: extreme(aligned.hours, aligned.nokPerKwh, "min"),
    priciestHour: extreme(aligned.hours, aligned.nokPerKwh, "max"),
    metricPeakHour: extreme(aligned.hours, aligned.metricValues, "max"),
    cheapestWindow: deriveCheapestWindow(aligned, CHEAPEST_WINDOW_HOURS),
  };
}

/**
 * The cheapest run of `length` consecutive hours.
 *
 * This is the question a consumer actually asks — not "which single hour is cheapest" but
 * "when should I start the machine" — and it is why the answer is a *window* rather than
 * the three cheapest hours in the day, which could be scattered across it.
 *
 * A window containing an hour without a price is skipped rather than averaged over the
 * hours it does have: "cheapest three hours" made from two would be a different claim,
 * quietly.
 */
export function deriveCheapestWindow(
  aligned: AlignedHours,
  length: number,
): PriceWindow | null {
  if (length < 1 || aligned.hours.length < length) {
    return null;
  }

  let best: PriceWindow | null = null;

  for (let start = 0; start + length <= aligned.hours.length; start += 1) {
    const prices = aligned.nokPerKwh.slice(start, start + length);
    if (prices.some((price) => price === null)) {
      continue;
    }

    const average = mean(prices);
    // Non-null by construction, but the compiler cannot see that through `mean`.
    if (average === null || (best !== null && average >= best.averageNokPerKwh)) {
      continue;
    }

    best = {
      from: aligned.hours[start],
      // Derived from the last hour's instant, not from a local-time calculation: the
      // hours are an hour apart in real time even on the days the wall clock is not.
      until: new Date(aligned.hours[start + length - 1].getTime() + 3_600_000),
      averageNokPerKwh: average,
      hourCount: length,
    };
  }

  return best;
}

/** Signed fraction of `value` against `reference`, or null when it cannot be computed. */
function ratioAgainst(value: number | null, reference: number | null): number | null {
  if (value === null || reference === null || reference === 0) {
    return null;
  }

  return (value - reference) / reference;
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
