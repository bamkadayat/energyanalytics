import { connection } from "next/server";
import { getPrices, type PriceFetchResult } from "@/features/energy-prices";
import { getWeather, type WeatherFetchResult } from "@/features/weather-forecast";
import { WEATHER_METRICS } from "@/shared/config";
import { formatOsloDate } from "@/shared/lib/format-oslo";
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
          {/*
            Columns stay equal height, and the chart *grows into* the taller of the two
            rather than the card padding the difference with empty white. `items-start`
            was the other way to remove that white space, but it left the page with a
            ragged bottom edge and a chart no bigger than its minimum.
          */}
          <div className="flex flex-col gap-6">
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
            chart={<CorrelationChart series={toChartSeries(aligned)} />}
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
          />

          {/*
            The rail beside the chart: what the chart says, then the one figure that is a
            decision rather than a reading.
          */}
          {/*
            Three arrangements, one for each amount of room:
            - phone: one column, each card full width
            - tablet and laptop, where the chart has gone full width above: the two cards
              sit side by side, so a short card is not a full-width band of white
            - `xl` and up: back to one column, because here they *are* the column beside
              the chart

            `items-start` so the shorter card keeps its own height rather than being
            stretched to the taller one's.
          */}
          {/*
            Stacked full width until `xl`, side by side from there. Two cards this dense
            need a wide page to sit next to each other and still hold a sentence, which
            `md` and `lg` do not have once the rail is subtracted.

            `items-start` so the shorter card keeps its own height instead of being
            stretched to the taller one's and padding the difference with white.
          */}
          <div className="grid gap-4 xl:grid-cols-2 xl:items-start">
            <div className="rounded-card border border-line bg-surface p-4">
              <InsightsList insights={insights} />
            </div>

            <CheapestWindowCard aligned={aligned} summary={summary} />
          </div>
          </div>
        </>
      ) : prices.status !== "not-published" ? (
        <StatusMessage tone="neutral" title="No data for this day">
          Neither prices nor weather returned any hours for {formatOsloDate(day)}.
        </StatusMessage>
      ) : null}
    </div>
  );
}

function settledOr<T>(outcome: PromiseSettledResult<T>, fallback: T): T {
  return outcome.status === "fulfilled" ? outcome.value : fallback;
}

