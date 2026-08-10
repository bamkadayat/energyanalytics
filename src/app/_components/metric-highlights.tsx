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
  APP_LOCALE,
  PREVIEW_DAY,
  WEATHER_METRICS,
  WEATHER_METRIC_IDS,
  type WeatherMetricId,
} from "@/shared/config";
import { formatMetricValue } from "@/shared/lib/format-number";
import { formatOsloTime } from "@/shared/lib/format-oslo";
import { SpotlightCard } from "./spotlight-card";

/**
 * The three weather metrics, each with a real mini-chart from the hero's fixed day —
 * two requests for the section, no clock, still prerendered. Each card links to the
 * dashboard filtered to that metric: a real view, not a "Read more" pointing nowhere.
 */

/**
 * Index of the card that is grown. Derived rather than written as `1`, so it follows
 * `WEATHER_METRIC_IDS` if a fourth metric ever arrives — with an even count this picks
 * the left of the two middles, which is at least a definite answer rather than a silently
 * wrong one.
 */
const MIDDLE_CARD = Math.floor((WEATHER_METRIC_IDS.length - 1) / 2);

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
    /* Named so landmark navigation can reach it — an unnamed `<section>` is generic. */
    <section
      id="how-it-works"
      aria-labelledby="how-it-works-heading"
      className="scroll-mt-8 bg-page py-16 sm:py-24"
    >
      <div className="mx-auto w-full max-w-content px-4 sm:px-6">
        <div className="flex max-w-2xl flex-col gap-4">
          {/* The eyebrow said what the heading already says; the heading carries it. */}
          <h2
            id="how-it-works-heading"
            className="text-balance text-display font-semibold text-fg"
          >
            The same 24 hours, three ways to read them
          </h2>

          {/* Answers the hero's "How the data is joined" button, which links here. */}
          <p className="text-pretty text-fg-secondary">
            One weather reading beside the price curve, matched hour for hour rather than
            by position. A missing reading stays missing.
          </p>
        </div>

        {/*
          `lg:items-center`, so the two outer cards centre against the taller middle one.
          That is what makes the middle card read as raised — it grows on both edges and
          the others sit level with its centre. With `items-start` they would all share a
          top edge and the extra height would just hang off the bottom.
        */}
        <ul className="mt-12 grid gap-6 lg:grid-cols-3 lg:items-center">
          {WEATHER_METRIC_IDS.map((id, index) => {
            const aligned = hasData
              ? alignPriceAndWeather(
                  prices.prices,
                  weather.status === "ok" ? weather.weather : null,
                  id,
                )
              : null;

            const hourLabels = aligned?.hours.map((hour) => formatOsloTime(hour)) ?? [];

            return (
              /*
                The **middle** card is the bigger one — a claim about position rather than
                about the metric. It used to be the default metric, which is the first of
                the three, and only the centre card can be grown without the row looking
                lopsided. One emphasised card beats a shadowed first and a bigger second,
                so the meaning moved rather than doubling; the hero preview still opens on
                `DEFAULT_WEATHER_METRIC`, which is where that signal lives now.
              */
              <SpotlightCard
                key={id}
                accent={`--chart-${id}`}
                featured={index === MIDDLE_CARD}
              >
                <MetricCardBody
                  id={id}
                  featured={index === MIDDLE_CARD}
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
  featured = false,
}: {
  id: WeatherMetricId;
  chart: PreviewChart | null;
  stats: MetricPreviewStats | null;
  featured?: boolean;
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

      {/*
        The featured card's extra height goes into its chart rather than into empty space
        at the bottom. Growing the padding alone would have made it bigger and emptier.
      */}
      {chart ? <CardChart chart={chart} id={id} featured={featured} /> : null}

      {stats ? (
        <p className="font-mono text-xs leading-relaxed text-fg-inverse-muted">
          {stats.max === null ? (
            "No readings for this day"
          ) : (
            /*
              Built from parts rather than one template string, so `lang` can sit on the
              `nb-NO` figures alone. The document is English; an English screen reader
              voices "0,4" as *nought comma four* or worse, when the value is 0.4 m/s.
              The words between them — "peak", "of", "hours" — stay English, which is why
              this cannot be one `lang` on the paragraph.
            */
            <>
              <span lang={APP_LOCALE}>
                {formatMetricValue(stats.min)}–{formatMetricValue(stats.max)}
              </span>{" "}
              · peak <span lang={APP_LOCALE}>{stats.peakHourLabel}</span> ·{" "}
              {readingCount(stats)}
            </>
          )}
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
 * This inverts the dashboard's solid/dashed convention deliberately — there the series
 * are peers, here the price is context. Nothing on the card depends on telling them
 * apart: the heading, chip and stat line all name the metric. A gap is still a gap.
 */
function CardChart({
  chart,
  id,
  featured = false,
}: {
  chart: PreviewChart;
  id: WeatherMetricId;
  featured?: boolean;
}) {
  const accent = `var(--chart-${id})`;

  return (
    <svg
      viewBox={`0 0 ${chart.width} ${chart.height}`}
      className={`w-full ${featured ? "h-24 lg:h-36" : "h-24"}`}
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
          <path d={chart.metricArea} fill={`url(#card-fill-${id})`} />
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
