import type { PriceFetchResult } from "@/features/energy-prices";
import type { WeatherFetchResult } from "@/features/weather-forecast";
import { TOMORROW_PRICES_PUBLISHED_HOUR, WEATHER_METRICS } from "@/shared/config";
import { buttonClasses, StatusMessage } from "@/shared/ui";
import type { AlignmentCoverage } from "../types";
import { viewParamsHref, type ViewParams } from "../utils/view-params";

/**
 * Provider results as banners. Copy rule: say what happened and what it means for the
 * data on screen. Never apologise for a state that is not a failure.
 */
export function SourceStatus({
  prices,
  weather,
  coverage,
  params,
}: {
  prices: PriceFetchResult;
  weather: WeatherFetchResult;
  coverage: AlignmentCoverage;
  params: ViewParams;
}) {
  const metricLabel = WEATHER_METRICS[params.metric].label.toLowerCase();

  return (
    <div className="flex flex-col gap-3">
      {prices.status === "not-published" ? (
        <StatusMessage
          tone="warning"
          title="Tomorrow's prices are not published yet"
        >
          Day-ahead prices for tomorrow are usually available from about{" "}
          {TOMORROW_PRICES_PUBLISHED_HOUR}:00 Norwegian time, once the auction has
          cleared. Today&rsquo;s prices are available now.
        </StatusMessage>
      ) : null}

      {prices.status === "error" ? (
        <StatusMessage
          tone="error"
          title="Could not load electricity prices"
          action={<RetryLink params={params} />}
        >
          {describeFailure(prices.reason, "the price service")}
        </StatusMessage>
      ) : null}

      {weather.status === "error" ? (
        <StatusMessage
          tone="warning"
          title="Weather data is unavailable"
          action={<RetryLink params={params} />}
        >
          {describeFailure(weather.reason, "the weather service")} Prices are shown
          without the {metricLabel} series.
        </StatusMessage>
      ) : null}

      {weather.status === "ok" && weather.unavailableMetrics.includes(params.metric) ? (
        <StatusMessage tone="warning" title={`No ${metricLabel} readings for this day`}>
          The forecast came back without a usable {metricLabel} series, so only prices are
          plotted. Another metric may still have data.
        </StatusMessage>
      ) : null}

      {prices.status === "ok" && prices.droppedEntries > 0 ? (
        <StatusMessage tone="warning" title="Some hours are missing from the price data">
          {prices.droppedEntries}{" "}
          {prices.droppedEntries === 1 ? "hour was" : "hours were"} discarded because the
          provider sent values that could not be read. The rest of the day is shown as
          normal.
        </StatusMessage>
      ) : null}

      {coverage.priceOnlyHours > 0 && weather.status === "ok" ? (
        <StatusMessage tone="warning" title="Weather is missing for some hours">
          {coverage.priceOnlyHours}{" "}
          {coverage.priceOnlyHours === 1 ? "hour has" : "hours have"} a price but no{" "}
          {metricLabel} reading. Those hours appear as gaps rather than zeroes.
        </StatusMessage>
      ) : null}
    </div>
  );
}

/**
 * Errors explain what happened and, where it helps, what to do — in the interface's
 * voice, without apologising.
 */
function describeFailure(reason: string, service: string): string {
  switch (reason) {
    case "timeout":
      return `${capitalise(service)} took too long to respond.`;
    case "network":
      return `${capitalise(service)} could not be reached.`;
    case "provider-error":
      return `${capitalise(service)} returned an error.`;
    case "invalid-json":
    case "malformed-payload":
    case "no-usable-hours":
      return `${capitalise(service)} returned data this page could not read.`;
    case "not-found":
      return `${capitalise(service)} has no data for this day.`;
    default:
      return `${capitalise(service)} is unavailable.`;
  }
}

function capitalise(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

/**
 * A plain link to the current URL: re-requesting is exactly what retrying means here,
 * and it needs no client JavaScript. Retry is only offered for transport failures, where
 * trying again can genuinely produce a different answer.
 */
function RetryLink({ params }: { params: ViewParams }) {
  return (
    <a
      href={viewParamsHref(params)}
      className={buttonClasses({ variant: "outline", size: "sm" })}
    >
      Try again
    </a>
  );
}
