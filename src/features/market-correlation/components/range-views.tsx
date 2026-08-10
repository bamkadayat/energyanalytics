import { connection } from "next/server";
import { getPriceRange } from "@/features/energy-prices";
import { getWeatherRange } from "@/features/weather-forecast";
import { PRICE_AREA, PRICE_UNIT, RANGE_DAY_OPTIONS } from "@/shared/config";
import { formatCount, formatPrice } from "@/shared/lib/format-number";
import { formatOsloDateShort } from "@/shared/lib/format-oslo";
import { osloDaysBack } from "@/shared/lib/oslo-day";
import { StatusMessage } from "@/shared/ui";
import { alignPriceAndWeather } from "../utils/align-hours";
import {
  deriveDurationCurve,
  derivePriceHeatmap,
} from "../utils/derive-range-views";
import { hrefWith, type ViewParams } from "../utils/view-params";
import { DurationCurveChart } from "./duration-curve";
import { ChartToolbar } from "./chart-toolbar";
import { DurationCurveTable, HeatmapTable } from "./range-tables";
import { ViewCard } from "./view-card";
import { PriceHeatmapChart } from "./price-heatmap";

/**
 * The range-scale views: 30 days of hourly prices, ~720 points.
 *
 * Everything expensive happens here, on the server. The two providers are fetched
 * concurrently — one request for the whole weather span, 30 individually cached requests
 * for prices — then joined and reduced to exactly what each chart draws. The browser
 * receives derived arrays, not raw rows, and does no sorting or bucketing.
 *
 * Streams independently of the single-day view above it, so a slow 30-day fetch never
 * delays today's chart.
 */
export async function RangeViews({ params }: { params: ViewParams }) {
  await connection();

  const days = osloDaysBack(new Date(), params.range);

  const [priceResults, weather] = await Promise.all([
    getPriceRange(days),
    getWeatherRange(days[0], days[days.length - 1]),
  ]);

  /*
   * Days that failed are dropped rather than propagated. A 30-day view is still useful
   * with 29 days in it, and one provider hiccup should not blank the section.
   */
  const prices = priceResults.flatMap((result) =>
    result.status === "ok" ? result.prices : [],
  );
  const daysLoaded = priceResults.filter((result) => result.status === "ok").length;

  const aligned = alignPriceAndWeather(
    prices,
    weather.status === "ok" ? weather.weather : null,
    params.metric,
  );

  const heatmap = derivePriceHeatmap(aligned);
  const curve = deriveDurationCurve(aligned);

  if (curve.hours === 0) {
    return (
      <StatusMessage tone="neutral" title="No range data available">
        Prices for the last {params.range} days could not be loaded.
      </StatusMessage>
    );
  }

  return (
    <section className="flex min-w-0 flex-col gap-4" aria-labelledby="range-heading">
      <div className="flex flex-col gap-3">
        <div className="flex flex-col gap-1">
          <h2 id="range-heading" className="text-lg font-semibold text-fg">
            The last {params.range} days
          </h2>
          {/*
            Three sentences, one fact each. It was one sentence carrying the count, the
            median and both tails, with "at or above" and "at or below" a few words
            apart — which is a lot to hold while working out which end is which.
          */}
          <p className="text-sm text-fg-muted">
            {formatCount(curve.hours)} priced hours across {daysLoaded} days in{" "}
            {PRICE_AREA.label}. Half the hours cost more than{" "}
            {formatPrice(curve.median)} {PRICE_UNIT} and half cost less. The dearest tenth
            cost {formatPrice(curve.expensiveTenth)} or more; the cheapest tenth cost{" "}
            {formatPrice(curve.cheapestTenth)} or less.
          </p>
        </div>

        <ChartToolbar
          label="Range length"
          presets={[...RANGE_DAY_OPTIONS]
            .sort((a, b) => b - a)
            .map((days) => ({
              key: String(days),
              label: `${days} days`,
              href: hrefWith(params, { range: days }),
              selected: params.range === days,
            }))}
          period={`${formatOsloDateShort(days[0])} – ${formatOsloDateShort(days[days.length - 1])}`}
        />
      </div>

      {daysLoaded < params.range ? (
        <StatusMessage tone="warning" title="Some days are missing from the range">
          {params.range - daysLoaded} of {params.range} days could not be loaded. The
          views below cover the rest.
        </StatusMessage>
      ) : null}

      <div className="grid gap-6 2xl:grid-cols-2">
      <ViewCard
        title="Price by hour and day"
        paramKey="heatmap"
        initialMode={params.heatmap}
        chart={<PriceHeatmapChart heatmap={heatmap} />}
        chartMinHeight="var(--chart-heatmap-height)"
        table={<HeatmapTable heatmap={heatmap} />}
        chartCaption={
          <>
            Spot price by hour of day, one column per day, oldest first. Darker is more
            expensive; the scale is ordered by lightness so it still reads without colour.
            {heatmap.collapsedHours > 0
              ? ` ${heatmap.collapsedHours} hour(s) share a cell where the clock went back.`
              : ""}
          </>
        }
        tableCaption={
          <>The same grid as numbers, in {PRICE_UNIT}, Europe/Oslo time.</>
        }
      />

      <ViewCard
        /*
         * Named for what it shows, not for what the technique is called. "Price duration
         * curve" is precise to an energy analyst and opaque to everyone else; the domain
         * term is in the caption, where it can be looked up rather than decoded.
         */
        title="Hours sorted by price"
        paramKey="curve"
        initialMode={params.curve}
        chart={<DurationCurveChart curve={curve} />}
        table={<DurationCurveTable curve={curve} />}
        chartCaption={
          <>
            A price duration curve: every hour in the range sorted from most expensive to
            least, so the bottom axis is a share of hours and <strong>not</strong> a
            timeline. At 25 %, a quarter of all hours cost at least the price beside it —
            the steeper the left end, the more the range was driven by a few costly hours.
            Drag or scroll to zoom.
          </>
        }
        tableCaption={
          <>
            The same curve as deciles. 720 sorted rows would answer no question anyone
            actually asks; these ten lines answer the one the curve exists for.
          </>
        }
      />
      </div>
    </section>
  );
}
