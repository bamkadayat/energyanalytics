import { connection } from "next/server";
import { getPrices, type PriceFetchResult } from "@/features/energy-prices";
import { getWeather, type WeatherFetchResult } from "@/features/weather-forecast";
import { PRICE_UNIT, WEATHER_LOCATION, WEATHER_METRICS } from "@/shared/config";
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
import type { ViewParams } from "../utils/view-params";
import { CorrelationChart } from "./correlation-chart";
import { SourceStatus } from "./source-status";

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

  return (
    <div className="flex flex-col gap-6">
      <h2 className="text-lg font-medium text-fg">{formatOsloDate(day)}</h2>

      <SourceStatus
        prices={prices}
        weather={weather}
        coverage={aligned.coverage}
        params={params}
      />

      {hasAnything ? (
        <>
          <figure className="flex flex-col gap-3 rounded-card border border-line bg-surface p-4">
            <CorrelationChart series={toChartSeries(aligned)} />
            <figcaption className="text-sm text-fg-muted">
              Spot price (solid, left axis) against {metric.label.toLowerCase()} (dashed,
              right axis) for {formatOsloDate(day)}, by hour in Oslo time. The two axes use
              independent scales.
            </figcaption>
          </figure>

          {/*
            Kept alongside the chart, not replaced by it: ui-rules.md requires the chart
            never be the only way to understand the result.
          */}
          <p className="text-fg-secondary">
            {aligned.hours.length} hours of data.{" "}
            {aligned.coverage.matchedHours} have both a spot price in {PRICE_UNIT} and a{" "}
            {metric.label.toLowerCase()} reading in {metric.unit}.
          </p>

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
    <footer className="flex flex-col gap-1 border-t border-line pt-4 font-mono text-xs text-fg-muted">
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
