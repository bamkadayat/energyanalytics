import { PRICE_UNIT, WEATHER_METRICS } from "@/shared/config";
import { formatMetricValue, formatPrice, MISSING_VALUE } from "@/shared/lib/format-number";
import { formatOsloTime } from "@/shared/lib/format-oslo";
import type { AlignedHours } from "../types";
import type { DaySummary } from "../utils/derive-summary";

/**
 * The headline numbers, all derived from the same aligned dataset the chart and table
 * use. There is no second derivation path, so a card cannot disagree with the graph
 * beside it.
 *
 * Every card states its unit. A figure without one is how "8" ends up meaning m/s to the
 * writer and °C to the reader.
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
    <dl className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      <Card
        term={summary.currentHour ? `Price at ${formatOsloTime(summary.currentHour.at)}` : "Price now"}
        value={formatPrice(summary.currentHour?.nokPerKwh)}
        unit={PRICE_UNIT}
        // Viewing tomorrow, there is no current hour. Say so rather than showing a dash
        // that looks like missing data.
        note={summary.currentHour ? undefined : "Not part of the selected day"}
      />

      <Card
        term="Daily average"
        value={formatPrice(summary.averageNokPerKwh)}
        unit={PRICE_UNIT}
        note="Mean of the hours that have a price"
      />

      <Card
        term="Cheapest hour"
        value={formatPrice(summary.cheapestHour?.value)}
        unit={PRICE_UNIT}
        note={summary.cheapestHour ? formatOsloTime(summary.cheapestHour.at) : undefined}
      />

      <Card
        term="Most expensive hour"
        value={formatPrice(summary.priciestHour?.value)}
        unit={PRICE_UNIT}
        note={summary.priciestHour ? formatOsloTime(summary.priciestHour.at) : undefined}
      />

      <Card
        term={
          summary.currentHour
            ? `${metric.label} at ${formatOsloTime(summary.currentHour.at)}`
            : `${metric.label} now`
        }
        value={formatMetricValue(summary.currentHour?.metricValue)}
        unit={metric.unit}
        note={summary.currentHour ? undefined : "Not part of the selected day"}
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
  );
}

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
    <div className="flex flex-col gap-1 rounded-card border border-line bg-surface p-4">
      <dt className="font-mono text-xs uppercase tracking-wider text-fg-muted">{term}</dt>

      <dd className="flex items-baseline gap-1.5">
        <span className="font-mono text-2xl font-semibold text-fg">{value}</span>
        {/* The unit is hidden when there is no value, so "— NOK/kWh" never appears. */}
        {missing ? null : <span className="text-sm text-fg-muted">{unit}</span>}
      </dd>

      {note ? <p className="text-xs text-fg-muted">{note}</p> : null}
    </div>
  );
}
