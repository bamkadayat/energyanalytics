import { PRICE_UNIT, WEATHER_METRICS } from "@/shared/config";
import {
  formatMetricValue,
  formatPercentDifference,
  formatPrice,
  MISSING_VALUE,
} from "@/shared/lib/format-number";
import { formatOsloTime } from "@/shared/lib/format-oslo";
import type { AlignedHours } from "../types";
import type { DaySummary } from "../utils/derive-summary";
import { PriceStrip } from "./price-strip";

/**
 * The headline numbers, all derived from the same aligned dataset the chart and table
 * use. There is no second derivation path, so a card cannot disagree with the graph
 * beside it.
 *
 * Every card states its unit. A figure without one is how "8" ends up meaning m/s to the
 * writer and °C to the reader.
 *
 * The current price gets a card of its own, several times the size of the rest. Six equal
 * cards made the reader decide what mattered; one number is what someone opening this
 * page came for, and the four beside it are the context for reading it.
 */
export function SummaryCards({
  aligned,
  summary,
}: {
  aligned: AlignedHours;
  summary: DaySummary;
}) {
  const metric = WEATHER_METRICS[aligned.metricId];

  return (
    <div className="grid gap-3 xl:grid-cols-[minmax(0,1.15fr)_minmax(0,1.85fr)]">
      <PriceNowCard aligned={aligned} summary={summary} />

      {/*
        Two by two rather than four in a row, at every width. A single row would stretch
        each card to the tall card's height and leave two thirds of it empty — the grid
        is sized by what the cards hold, not by what sits next to them.
      */}
      <dl className="grid gap-3 sm:grid-cols-2">
        <Card
          term="Cheapest hour"
          value={formatPrice(summary.cheapestHour?.value)}
          unit={PRICE_UNIT}
          note={summary.cheapestHour ? formatOsloTime(summary.cheapestHour.at) : undefined}
        />

        <Card
          term="Priciest hour"
          value={formatPrice(summary.priciestHour?.value)}
          unit={PRICE_UNIT}
          note={summary.priciestHour ? formatOsloTime(summary.priciestHour.at) : undefined}
        />

        <Card
          term={
            summary.currentHour ? `${metric.label} now` : `${metric.label}, selected day`
          }
          value={formatMetricValue(summary.currentHour?.metricValue)}
          unit={metric.unit}
          note={
            summary.currentHour
              ? formatOsloTime(summary.currentHour.at)
              : "Not part of the selected day"
          }
        />

        <Card
          term={`${metric.label} peak`}
          value={formatMetricValue(summary.metricPeakHour?.value)}
          unit={metric.unit}
          note={
            summary.metricPeakHour ? formatOsloTime(summary.metricPeakHour.at) : undefined
          }
        />
      </dl>
    </div>
  );
}

/**
 * The current hour's price, the day's average, and the shape of the whole day.
 *
 * The three belong together: a price means nothing without the second, and the second
 * means nothing without the third.
 */
function PriceNowCard({
  aligned,
  summary,
}: {
  aligned: AlignedHours;
  summary: DaySummary;
}) {
  const price = formatPrice(summary.currentHour?.nokPerKwh);
  const missing = price === MISSING_VALUE;

  return (
    <section
      aria-label="Current price"
      className="flex flex-col gap-4 rounded-card border border-line bg-surface p-4 sm:p-5"
    >
      <p className="font-mono text-[0.6875rem] uppercase tracking-wider text-fg-muted">
        {summary.currentHour
          ? `Price now · ${formatOsloTime(summary.currentHour.at)}`
          : "Price · selected day"}
      </p>

      <p className="flex flex-wrap items-baseline gap-2">
        <span className="font-mono text-4xl font-semibold tabular-nums leading-none text-fg sm:text-5xl">
          {price}
        </span>
        {missing ? null : <span className="text-fg-muted">{PRICE_UNIT}</span>}
      </p>

      <ComparisonLine summary={summary} />

      <PriceStrip
        aligned={aligned}
        currentIndex={indexOf(aligned, summary.currentHour?.at)}
      />
    </section>
  );
}

/**
 * "−47 % against today's average of 1,065 NOK/kWh".
 *
 * The pill carries the sign explicitly rather than relying on colour: a red 47 % could
 * mean either direction, and this is the one figure on the page a reader is most likely
 * to act on. Since the sign is doing the work, the pill is **neutral** — a green or red
 * fill here was the third place on the screen saying "cheap" or "dear" in colour, and
 * spending the palette on chrome is what leaves nothing left for the chart.
 */
function ComparisonLine({ summary }: { summary: DaySummary }) {
  const average = summary.averageNokPerKwh;

  if (average === null) {
    return (
      <p className="text-sm text-fg-muted">No prices published for the selected day.</p>
    );
  }

  const difference = summary.currentVsAverage;

  return (
    <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-fg-secondary">
      {difference === null ? null : (
        <span className="rounded-pill bg-surface-subtle px-2 py-0.5 font-mono text-xs tabular-nums text-fg-secondary">
          {difference >= 0 ? "+" : "−"}
          {formatPercentDifference(difference)}
        </span>
      )}

      <span>
        {difference === null ? "The day averages" : "against a daily average of"}{" "}
        <span className="font-mono tabular-nums text-fg">{formatPrice(average)}</span>{" "}
        {PRICE_UNIT}
      </span>
    </p>
  );
}

/** Position of an hour in the day, or -1 when it is not one of them. */
function indexOf(aligned: AlignedHours, at: Date | undefined): number {
  if (at === undefined) {
    return -1;
  }

  return aligned.hours.findIndex((hour) => hour.getTime() === at.getTime());
}

/**
 * Four identical cards.
 *
 * The cheapest and priciest cards used to carry a coloured left edge, which made two of
 * the four look like a different component and spent the loudest colours on the page on
 * something the words "Cheapest hour" and "Priciest hour" already say. A KPI strip reads
 * as a strip when its cards match.
 */
function Card({
  term,
  value,
  unit,
  note,
}: {
  term: string;
  value: string;
  unit: string;
  note?: string;
}) {
  const missing = value === MISSING_VALUE;

  return (
    // Denser than a content card: a KPI strip is scanned, not read.
    <div className="flex flex-col gap-1 rounded-card border border-line bg-surface p-3">
      <dt className="truncate font-mono text-[0.6875rem] uppercase tracking-wider text-fg-muted">
        {term}
      </dt>

      <dd className="flex items-baseline gap-1.5">
        <span className="font-mono text-xl font-semibold tabular-nums text-fg">
          {value}
        </span>
        {/* The unit is hidden when there is no value, so "— NOK/kWh" never appears. */}
        {missing ? null : <span className="text-sm text-fg-muted">{unit}</span>}
      </dd>

      {note ? <p className="truncate text-xs text-fg-muted">{note}</p> : null}
    </div>
  );
}
