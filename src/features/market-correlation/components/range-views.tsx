import { connection } from "next/server";
import { getPriceRange } from "@/features/energy-prices";
import { getWeatherRange } from "@/features/weather-forecast";
import { PRICE_AREA, PRICE_UNIT, RANGE_DAYS } from "@/shared/config";
import { formatPrice } from "@/shared/lib/format-number";
import { osloDaysBack } from "@/shared/lib/oslo-day";
import { StatusMessage } from "@/shared/ui";
import { alignPriceAndWeather } from "../utils/align-hours";
import {
  deriveDurationCurve,
  derivePriceHeatmap,
} from "../utils/derive-range-views";
import { hrefWith, type ViewParams } from "../utils/view-params";
import { DurationCurveChart } from "./duration-curve";
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

  const days = osloDaysBack(new Date(), RANGE_DAYS);

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
        Prices for the last {RANGE_DAYS} days could not be loaded.
      </StatusMessage>
    );
  }

  return (
    <section className="flex flex-col gap-8" aria-labelledby="range-heading">
      <div className="flex flex-col gap-2">
        <h2 id="range-heading" className="text-xl font-semibold text-fg">
          The last {RANGE_DAYS} days
        </h2>
        <p className="text-sm text-fg-muted">
          {curve.hours.toLocaleString("en")} priced hours across {daysLoaded} days in{" "}
          {PRICE_AREA.label}. Median {formatPrice(curve.median)} {PRICE_UNIT}, with the
          most expensive tenth of hours at or above {formatPrice(curve.p10)} and the
          cheapest tenth at or below {formatPrice(curve.p90)}.
        </p>
      </div>

      {daysLoaded < RANGE_DAYS ? (
        <StatusMessage tone="warning" title="Some days are missing from the range">
          {RANGE_DAYS - daysLoaded} of {RANGE_DAYS} days could not be loaded. The views
          below cover the rest.
        </StatusMessage>
      ) : null}

      <ViewCard
        title="Price by hour and day"
        mode={params.heatmap}
        chartHref={hrefWith(params, { heatmap: "chart" })}
        tableHref={hrefWith(params, { heatmap: "table" })}
        caption={
          <>
            Spot price by hour of day, one column per day, oldest first. Darker is more
            expensive; the scale is ordered by lightness so it still reads without colour.
            {heatmap.collapsedHours > 0
              ? ` ${heatmap.collapsedHours} hour(s) share a cell where the clock went back.`
              : ""}
          </>
        }
      >
        {params.heatmap === "chart" ? (
          <PriceHeatmapChart heatmap={heatmap} />
        ) : (
          <HeatmapTable heatmap={heatmap} />
        )}
      </ViewCard>

      <ViewCard
        title="Price duration curve"
        mode={params.curve}
        chartHref={hrefWith(params, { curve: "chart" })}
        tableHref={hrefWith(params, { curve: "table" })}
        caption={
          params.curve === "chart" ? (
            <>
              Every hour sorted from most to least expensive. Read it as &ldquo;this share
              of hours cost at least this much&rdquo;. Drag the slider or scroll to zoom
              into the expensive shoulder.
            </>
          ) : (
            <>
              The same curve as deciles. 720 sorted rows would answer no question anyone
              actually asks; these ten lines answer the one the curve exists for.
            </>
          )
        }
      >
        {params.curve === "chart" ? (
          <DurationCurveChart curve={curve} />
        ) : (
          <DurationCurveTable curve={curve} />
        )}
      </ViewCard>
    </section>
  );
}
