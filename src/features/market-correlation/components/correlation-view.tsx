import { connection } from "next/server";
import { getPrices, type PriceFetchResult } from "@/features/energy-prices";
import { getWeather, type WeatherFetchResult } from "@/features/weather-forecast";
import { WEATHER_LOCATION, WEATHER_METRICS } from "@/shared/config";
import {
  formatOsloDate,
  formatOsloDateTime,
  toDateTimeAttribute,
} from "@/shared/lib/format-oslo";
import { areTomorrowPricesExpected, resolveOsloDay } from "@/shared/lib/oslo-day";
import type { Fetched } from "@/shared/lib/fetched";
import { StatusMessage } from "@/shared/ui";
import { alignPriceAndWeather } from "../utils/align-hours";
import { toChartSeries } from "../utils/to-chart-series";
import { deriveDaySummary } from "../utils/derive-summary";
import { deriveInsights } from "../utils/derive-insights";
import type { ViewParams } from "../utils/view-params";
import { CheapestWindowCard } from "./cheapest-window-card";
import { CorrelationChart } from "./correlation-chart";
import { SummaryCards } from "./summary-cards";
import { HourlyDataTable } from "./hourly-data-table";
import { HourlyTable } from "./hourly-table";
import { InsightsList } from "./insights-list";
import { SeriesLegend } from "./series-legend";
import { SourceStatus } from "./source-status";
import { ViewCard } from "./view-card";

/**
 * The conductor: resolves the day, fetches both providers, joins them, and hands the
 * result to presentation.
 *
 * `await connection()` first. Reading the clock is request-time work, and without this
 * the build fails with `blocking-prerender-current-time` — `<Suspense>` alone does not
 * satisfy it. Everything below the call runs per request while the page shell stays
 * static (see context/library-docs.md).
 */
export async function CorrelationView({ params }: { params: ViewParams }) {
  await connection();

  const now = new Date();
  const day = resolveOsloDay(now, params.day);

  /*
   * Tomorrow before the auction clears gets the short cache lifetime, so prices that
   * appear minutes later are not hidden behind a stale "not published" entry.
   */
  const pricesSettled = params.day === "today" || areTomorrowPricesExpected(now);

  /*
   * allSettled, not all: the two providers are independent, and one being down must not
   * take the other's data off the page.
   */
  const [priceOutcome, weatherOutcome] = await Promise.allSettled([
    getPrices(day, pricesSettled),
    getWeather(day),
  ]);

  // A rejection means a bug rather than a provider failure — the fetchers already turn
  // those into values — so it surfaces as an error result instead of crashing the render.
  const prices = settledOr<Fetched<PriceFetchResult>>(priceOutcome, {
    status: "error",
    reason: "network",
    fetchedAt: now,
  });
  const weather = settledOr<Fetched<WeatherFetchResult>>(weatherOutcome, {
    status: "error",
    reason: "network",
    fetchedAt: now,
  });

  const aligned = alignPriceAndWeather(
    prices.status === "ok" ? prices.prices : [],
    weather.status === "ok" ? weather.weather : null,
    params.metric,
  );

  const metric = WEATHER_METRICS[params.metric];
  const hasAnything = aligned.hours.length > 0;

  // Cards, observations, chart and table all read this one derivation.
  const summary = deriveDaySummary(aligned, now);
  const insights = deriveInsights(aligned, summary);

  return (
    <div className="flex min-w-0 flex-col gap-6">
      {/*
        No day switch and no date heading here: both live in the page header now. This
        section used to open with a second copy of the day control and a title that
        repeated the card's own — chrome for chrome.
      */}
      <SourceStatus
        prices={prices}
        weather={weather}
        coverage={aligned.coverage}
        params={params}
      />

      {hasAnything ? (
        <>
          <SummaryCards aligned={aligned} summary={summary} />

          {/*
            Chart and observations side by side on wide screens. The observations are a
            reading of the chart, so putting them next to it beats making the reader
            scroll between the two.
          */}
          <div className="grid gap-6 xl:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
          <ViewCard
            title="Hour by hour"
            paramKey="view"
            initialMode={params.view}
            legend={
              <SeriesLegend
                priceLabel="Spot price"
                metricLabel={metric.label}
                metricId={aligned.metricId}
              />
            }
            chart={
              <>
                <CorrelationChart series={toChartSeries(aligned)} />
                {/*
                  The table stays reachable *while the chart is showing*. The canvas is
                  opaque to assistive technology, so the numbers must not depend on
                  noticing the toggle — it is a convenience, not the only route.
                */}
                <HourlyTable aligned={aligned} day={day} />
              </>
            }
            table={
              <HourlyDataTable
                metricId={aligned.metricId}
                caption={`Hourly spot price and ${metric.label.toLowerCase()} for ${formatOsloDate(day)}, in Europe/Oslo time.`}
                rows={aligned.hours.map((hour, index) => ({
                  hour,
                  nokPerKwh: aligned.nokPerKwh[index] ?? null,
                  metricValue: aligned.metricValues[index] ?? null,
                }))}
              />
            }
            chartCaption={
              <>
                Spot price (solid, left axis) against {metric.label.toLowerCase()}{" "}
                (dashed, right axis) for {formatOsloDate(day)}, by hour in Oslo time. The
                axes use independent scales, so crossings are not comparisons.
              </>
            }
            tableCaption={
              <>
                The same hours as numbers. {formatOsloDate(day)}, Europe/Oslo time.
              </>
            }
          />

          {/*
            The rail beside the chart: what the chart says, then the one figure that is a
            decision rather than a reading.
          */}
          <div className="flex flex-col gap-4">
            <div className="rounded-card border border-line bg-surface p-4">
              <InsightsList insights={insights} />
            </div>

            <CheapestWindowCard aligned={aligned} summary={summary} />
          </div>
          </div>

          <StatusMessage tone="info" title="How to read this">
            {WEATHER_LOCATION.label} weather is shown as a representative location within
            the price area. Visual relationships are exploratory and do not demonstrate
            causation. Prices exclude VAT, grid charges and other consumer costs.
          </StatusMessage>
        </>
      ) : prices.status !== "not-published" ? (
        <StatusMessage tone="neutral" title="No data for this day">
          Neither prices nor weather returned any hours for {formatOsloDate(day)}.
        </StatusMessage>
      ) : null}

      <Provenance
        priceFetchedAt={prices.fetchedAt}
        weatherFetchedAt={weather.fetchedAt}
      />
    </div>
  );
}

function settledOr<T>(outcome: PromiseSettledResult<T>, fallback: T): T {
  return outcome.status === "fulfilled" ? outcome.value : fallback;
}

/**
 * Where the numbers came from and when. Shown always, not only on success: knowing the
 * data is three hours old matters most when something looks wrong.
 */
function Provenance({
  priceFetchedAt,
  weatherFetchedAt,
}: {
  priceFetchedAt: Date;
  weatherFetchedAt: Date;
}) {
  return (
    <footer className="flex min-w-0 flex-col gap-1 break-words border-t border-line pt-4 font-mono text-xs text-fg-muted">
      <p>
        Prices:{" "}
        <a className="text-link underline underline-offset-2" href="https://www.hvakosterstrommen.no">
          hvakosterstrommen.no
        </a>
        {" · retrieved "}
        <time dateTime={toDateTimeAttribute(priceFetchedAt)}>
          {formatOsloDateTime(priceFetchedAt)}
        </time>
      </p>
      <p>
        Weather:{" "}
        <a className="text-link underline underline-offset-2" href="https://open-meteo.com">
          open-meteo.com
        </a>
        {" · retrieved "}
        <time dateTime={toDateTimeAttribute(weatherFetchedAt)}>
          {formatOsloDateTime(weatherFetchedAt)}
        </time>
      </p>
    </footer>
  );
}
