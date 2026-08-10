import { PRICE_UNIT, WEATHER_METRICS } from "@/shared/config";
import { formatPrice } from "@/shared/lib/format-number";
import { formatOsloTime } from "@/shared/lib/format-oslo";
import type { AlignedHours } from "../types";
import type { DaySummary } from "../utils/derive-summary";

/**
 * The cheapest run of consecutive hours, and how complete the join behind it is.
 *
 * The window is the one figure on this page that is a decision rather than a fact — "when
 * should I run the machine" — which is why it gets a card instead of a row in the
 * observations list.
 *
 * The coverage bar sits underneath because the two are read together: a window derived
 * from a day with holes in it deserves to be seen next to the holes.
 */
export function CheapestWindowCard({
  aligned,
  summary,
}: {
  aligned: AlignedHours;
  summary: DaySummary;
}) {
  const metric = WEATHER_METRICS[aligned.metricId];
  const window = summary.cheapestWindow;

  return (
    <section
      aria-labelledby="cheapest-window-heading"
      className="flex flex-col gap-3 rounded-card border border-line bg-surface p-4"
    >
      <h3 id="cheapest-window-heading" className="text-base font-semibold text-fg">
        {window
          ? `Cheapest ${window.hourCount} hours in a row`
          : "Cheapest hours in a row"}
      </h3>

      {window ? (
        <>
          <p className="flex flex-wrap items-baseline gap-2">
            <span className="font-mono text-3xl font-semibold tabular-nums leading-none text-fg">
              {formatPrice(window.averageNokPerKwh)}
            </span>
            <span className="text-sm text-fg-muted">{PRICE_UNIT}</span>
          </p>

          <p className="font-mono text-xs tabular-nums text-fg-secondary">
            {formatOsloTime(window.from)}–{formatOsloTime(window.until)}
          </p>
        </>
      ) : (
        <p className="text-sm text-fg-muted">
          No run of consecutive hours on this day has a price for every hour.
        </p>
      )}

      {/*
        The join, stated as a count. ui-rules.md requires that the chart never be the only
        way to understand the result, and "how many hours actually carry both series" is
        the thing a reader cannot get by looking at it.
      */}
      <CoverageBar
        matched={aligned.coverage.matchedHours}
        total={aligned.hours.length}
        label={`${aligned.coverage.matchedHours} of ${aligned.hours.length} hours have both a price and a ${metric.label.toLowerCase()} reading`}
      />
    </section>
  );
}

/**
 * How complete the join is.
 *
 * The sentence is the fact and the bar is the illustration, in that order of importance —
 * so the bar is `aria-hidden` and the count is read out in full.
 */
function CoverageBar({
  matched,
  total,
  label,
}: {
  matched: number;
  total: number;
  label: string;
}) {
  const filled = total === 0 ? 0 : (matched / total) * 100;

  return (
    <div className="flex flex-col gap-2 border-t border-line pt-3">
      <div
        aria-hidden="true"
        className="h-1.5 w-full overflow-hidden rounded-pill bg-surface-subtle"
      >
        <div
          // One fill at every level of coverage. Turning the bar green at 24 of 24 made a
          // full-width saturated rule the loudest thing in the column, to say what the
          // sentence under it already says — and a gap is normal, so the two states do
          // not need different colours in the first place.
          className="h-full rounded-pill bg-price-now"
          style={{ width: `${filled}%` }}
        />
      </div>

      <p className="font-mono text-xs tabular-nums text-fg-muted">{label}</p>
    </div>
  );
}
