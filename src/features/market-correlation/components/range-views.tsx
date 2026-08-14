import { connection } from "next/server";
import { getPriceRange } from "@/features/energy-prices";
import { getWeatherRange } from "@/features/weather-forecast";
import { PRICE_UNIT, RANGE_DAY_OPTIONS } from "@/shared/config";
import { formatOsloDateShort } from "@/shared/lib/format-oslo";
import { osloDaysBack } from "@/shared/lib/oslo-day";
import { StatusMessage } from "@/shared/ui";
import { alignPriceAndWeather } from "../utils/align-hours";
import { deriveHourSpread } from "../utils/derive-hour-spread";
import { deriveDurationCurve } from "../utils/derive-range-views";
import { hrefWith, type ViewParams } from "../utils/view-params";
import { DurationCurveChart } from "./duration-curve";
import { ChartToolbar } from "./chart-toolbar";
import { DurationCurveTable, HourSpreadTable } from "./range-tables";
import { ViewCard } from "./view-card";
import { HourSpreadChart } from "./hour-spread";

/**
 * The range-scale views — ~720 hourly points, all reduced on the server. Streams
 * independently of the day view, so a slow 30-day fetch never delays today's chart.
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

  const spread = deriveHourSpread(aligned);
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
        {/*
          The heading alone (2026-08-14, on request). The paragraph under it gave the
          priced-hour count, the area, the median and the two tenths in prose.

          Those figures are still reachable: both charts below carry a table alternative
          (`DurationCurveTable`, `HourSpreadTable`) through `ViewCard`'s toggle, and the
          duration curve draws its median as a labelled `markLine`. What is gone is the
          prose *restatement*, not the numbers.
        */}
        <h2 id="range-heading" className="text-lg font-semibold text-fg">
          The last {params.range} days
        </h2>

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
        title="What each hour costs"
        paramKey="heatmap"
        initialMode={params.heatmap}
        chart={<HourSpreadChart spread={spread} />}
        table={<HourSpreadTable spread={spread} />}
        chartCaption={
          <>
            Every hour of the day across the range, as a box: the line is the median, the
            box is the middle half of the prices, and the whiskers are the cheapest and
            dearest that hour ever was. Tall boxes are the hours worth planning around —
            the ones where the price actually moves.
            {spread.emptyHours > 0
              ? ` ${spread.emptyHours} hour(s) of the day had no price anywhere in the range.`
              : ""}
          </>
        }
        tableCaption={
          <>
            The same five numbers per hour, in {PRICE_UNIT}, with the day count behind
            each one.
          </>
        }
      />

      <ViewCard
        /* Named for what it shows. The domain term is in the caption, to look up. */
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
