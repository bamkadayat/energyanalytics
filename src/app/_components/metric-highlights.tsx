import Link from "next/link";
import { FiArrowRight } from "react-icons/fi";
import { getSettledPrices } from "@/features/energy-prices";
import { getWeather } from "@/features/weather-forecast";
import {
  alignPriceAndWeather,
  summariseMetric,
  toPreviewChart,
  type MetricPreviewStats,
  type PreviewChart,
} from "@/features/market-correlation";
import {
  DEFAULT_WEATHER_METRIC,
  PREVIEW_DAY,
  WEATHER_METRICS,
  WEATHER_METRIC_IDS,
  type WeatherMetricId,
} from "@/shared/config";
import { formatMetricValue } from "@/shared/lib/format-number";
import { formatOsloTime } from "@/shared/lib/format-oslo";
import { SpotlightCard } from "./spotlight-card";

/**
 * The three weather metrics, each with a real mini-chart from the example day.
 *
 * Same fixed day as the hero, fetched once and aligned three ways — two requests for the
 * whole section, and no clock, so it still prerenders.
 *
 * Each card links to the dashboard already filtered to that metric: a real view, not a
 * "Read more" pointing nowhere.
 */

/**
 * Kept to one short line each, and parallel. What they share — the price curve beside
 * them, the hour-for-hour join — is said once in the section intro, not three times.
 */
const DESCRIPTIONS: Record<WeatherMetricId, string> = {
  wind: "Wind speed over Oslo, hour by hour.",
  temperature: "Air temperature over Oslo, hour by hour.",
  solar: "Shortwave radiation across the daylight hours.",
};

export async function MetricHighlights() {
  const [prices, weather] = await Promise.all([
    getSettledPrices(PREVIEW_DAY),
    getWeather(PREVIEW_DAY),
  ]);

  const hasData = prices.status === "ok";

  return (
    <section id="how-it-works" className="scroll-mt-8 bg-page py-16 sm:py-24">
      <div className="mx-auto w-full max-w-content px-4 sm:px-6">
        <div className="flex max-w-2xl flex-col gap-4">
          {/* The eyebrow said what the heading already says; the heading carries it. */}
          <h2 className="text-balance text-display font-semibold text-fg">
            The same 24 hours, three ways to read them
          </h2>

          {/*
            Answers the hero's "How the data is joined" button, which links here. Stating
            the join is the honest version of a marketing claim — it is the part of the
            product that is actually hard.
          */}
          <p className="text-pretty text-fg-secondary">
            One weather reading beside the price curve, matched hour for hour rather than
            by position. A missing reading stays missing.
          </p>
        </div>

        <ul className="mt-12 grid gap-6 lg:grid-cols-3 lg:items-start">
          {WEATHER_METRIC_IDS.map((id) => {
            const aligned = hasData
              ? alignPriceAndWeather(
                  prices.prices,
                  weather.status === "ok" ? weather.weather : null,
                  id,
                )
              : null;

            const hourLabels = aligned?.hours.map((hour) => formatOsloTime(hour)) ?? [];

            return (
              <SpotlightCard
                key={id}
                accent={`--chart-${id}`}
                featured={id === DEFAULT_WEATHER_METRIC}
              >
                <MetricCardBody
                  id={id}
                  chart={aligned ? toPreviewChart(aligned, hourLabels, -1) : null}
                  stats={aligned ? summariseMetric(aligned, hourLabels) : null}
                />
              </SpotlightCard>
            );
          })}
        </ul>
      </div>
    </section>
  );
}

function MetricCardBody({
  id,
  chart,
  stats,
}: {
  id: WeatherMetricId;
  chart: PreviewChart | null;
  stats: MetricPreviewStats | null;
}) {
  const metric = WEATHER_METRICS[id];

  return (
    <>
      <div className="flex items-start justify-between gap-3">
        <h3 className="flex items-center gap-2.5 text-lg font-semibold">
          {/* Glows in the accent, so the swatch reads as lit rather than printed. */}
          <span
            aria-hidden="true"
            className="size-2.5 rounded-[3px]"
            style={{
              backgroundColor: `var(--chart-${id})`,
              boxShadow: `0 0 12px var(--chart-${id})`,
            }}
          />
          {metric.label}
        </h3>

        {/* The unit belongs in the chrome, not repeated inside the stat sentence. */}
        <span className="shrink-0 rounded-control border border-line-inverse px-2 py-0.5 font-mono text-[0.6875rem] uppercase text-fg-inverse-muted">
          {metric.unit}
        </span>
      </div>

      <p className="text-pretty text-sm leading-relaxed text-fg-inverse-muted">
        {DESCRIPTIONS[id]}
      </p>

      {chart ? <CardChart chart={chart} id={id} /> : null}

      {stats ? (
        <p className="font-mono text-xs leading-relaxed text-fg-inverse-muted">
          {stats.max === null
            ? "No readings for this day"
            : `${formatMetricValue(stats.min)}–${formatMetricValue(stats.max)} · peak ${stats.peakHourLabel} · ${readingCount(stats)}`}
        </p>
      ) : null}

      <Link
        href={`/dashboard?day=today&metric=${id}`}
        className="group mt-auto flex items-center justify-between gap-3 font-medium focus-visible:outline-fg-inverse"
      >
        <span className="underline-offset-4 group-hover:underline">
          Open the {metric.label.toLowerCase()} view
        </span>

        {/* Fills with the accent on hover, rather than nudging sideways. */}
        <span
          aria-hidden="true"
          className="relative flex size-9 shrink-0 items-center justify-center overflow-hidden rounded-pill border border-line-inverse transition-colors duration-200 group-hover:border-transparent group-hover:text-fg"
        >
          <span
            className="absolute inset-0 opacity-0 transition-opacity duration-200 group-hover:opacity-100"
            style={{ backgroundColor: `var(--chart-${id})` }}
          />
          <FiArrowRight className="relative size-4" />
        </span>
      </Link>
    </>
  );
}

/** Says what the card could not before: how much of the day actually had readings. */
function readingCount(stats: MetricPreviewStats): string {
  if (stats.missing === 0) {
    return `${stats.total} of ${stats.total} hours`;
  }
  return `${stats.missing} hour${stats.missing === 1 ? "" : "s"} without a reading`;
}

/**
 * Mini chart with depth: the metric in front, the price behind as a dashed ghost.
 *
 * This **inverts the dashboard's solid/dashed convention**, deliberately. There the two
 * series are peers, and line style is what separates them. Here the metric is the subject
 * and the price is context, so a ghost reads as a reference rather than as a second
 * metric. The dashboard's rule is untouched, and nothing on this card depends on telling
 * the two apart to be understood — the heading, the unit chip and the stat line all name
 * the metric.
 *
 * A gap is still a real break in the line.
 */
function CardChart({ chart, id }: { chart: PreviewChart; id: WeatherMetricId }) {
  const accent = `var(--chart-${id})`;

  return (
    <svg
      viewBox={`0 0 ${chart.width} ${chart.height}`}
      className="h-24 w-full"
      preserveAspectRatio="none"
      aria-hidden="true"
      role="presentation"
    >
      <defs>
        <linearGradient id={`card-fill-${id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={accent} stopOpacity="0.35" />
          <stop offset="100%" stopColor={accent} stopOpacity="0" />
        </linearGradient>
      </defs>

      {/* Price first, so it sits behind everything else. */}
      <path
        d={chart.priceLine}
        fill="none"
        stroke="var(--fg-inverse)"
        strokeWidth="1.5"
        strokeDasharray="5 6"
        strokeLinecap="round"
        opacity="0.35"
        vectorEffect="non-scaling-stroke"
      />

      {chart.metricLine ? (
        <>
          {/* Area under the metric, then a wide soft stroke as its glow. */}
          <path
            d={`${chart.metricLine} L${chart.width},${chart.height} L0,${chart.height} Z`}
            fill={`url(#card-fill-${id})`}
          />
          <path
            d={chart.metricLine}
            fill="none"
            stroke={accent}
            strokeWidth="7"
            strokeLinecap="round"
            opacity="0.18"
            vectorEffect="non-scaling-stroke"
          />
          <path
            d={chart.metricLine}
            fill="none"
            stroke={accent}
            strokeWidth="2.25"
            strokeLinecap="round"
            vectorEffect="non-scaling-stroke"
          />
        </>
      ) : null}
    </svg>
  );
}
