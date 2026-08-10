import Link from "next/link";
import { getSettledPrices } from "@/features/energy-prices";
import { getWeather } from "@/features/weather-forecast";
import {
  alignPriceAndWeather,
  toPreviewChart,
} from "@/features/market-correlation";
import {
  APP_LOCALE,
  PREVIEW_DAY,
  PREVIEW_HOUR_INDEX,
  PRICE_UNIT,
  WEATHER_METRICS,
  WEATHER_METRIC_IDS,
  type WeatherMetricId,
} from "@/shared/config";
import { formatMetricValue, formatPrice } from "@/shared/lib/format-number";
import { formatOsloTime } from "@/shared/lib/format-oslo";

const SWATCHES: Record<WeatherMetricId, string> = {
  wind: "bg-chart-wind",
  temperature: "bg-chart-temperature",
  solar: "bg-chart-solar",
};

/**
 * The dashboard preview beside the headline.
 *
 * Real market data from a fixed day, so no clock is involved and the whole thing
 * prerenders. Inline SVG rather than ECharts: a charting library on a landing page costs
 * the speed that is its main job. The metric pills are real links into the dashboard.
 */
export async function HeroPreview({ metric = "solar" }: { metric?: WeatherMetricId }) {
  const [prices, weather] = await Promise.all([
    getSettledPrices(PREVIEW_DAY),
    getWeather(PREVIEW_DAY),
  ]);

  if (prices.status !== "ok") {
    // The provider is unavailable at build time; the hero still renders without it.
    return null;
  }

  const aligned = alignPriceAndWeather(
    prices.prices,
    weather.status === "ok" ? weather.weather : null,
    metric,
  );

  const hourLabels = aligned.hours.map((hour) => formatOsloTime(hour).slice(0, 2));
  const chart = toPreviewChart(aligned, hourLabels, PREVIEW_HOUR_INDEX);
  const active = WEATHER_METRICS[metric];

  return (
    <div className="overflow-hidden rounded-bento border border-line-inverse bg-navy-deep text-fg-inverse">
      {/* Just the metric switch now — the dated "Example day" line has been removed. */}
      <header className="flex flex-wrap items-center gap-3 p-3">
        <ul className="flex gap-1 rounded-pill bg-surface-inverse p-1">
          {WEATHER_METRIC_IDS.map((id) => (
            <li key={id}>
              <Link
                href={`/dashboard?day=today&metric=${id}`}
                aria-current={id === metric ? "true" : undefined}
                /* The global `--focus` ring is navy on navy here, so it is overridden. */
                className={`flex items-center gap-2 rounded-pill px-3 py-1.5 text-sm focus-visible:outline-fg-inverse ${
                  id === metric
                    ? "bg-navy-deep font-medium text-fg-inverse"
                    : "text-fg-inverse-muted hover:text-fg-inverse"
                }`}
              >
                <span
                  aria-hidden="true"
                  className={`size-2 rounded-[2px] ${SWATCHES[id]}`}
                />
                {WEATHER_METRICS[id].label.replace(" speed", "").replace(" radiation", "")}
              </Link>
            </li>
          ))}
        </ul>

      </header>

      {/*
        Two figures, not three. These are also the chart's text alternative — the SVG is
        `aria-hidden` — so they are the one part of the card that cannot be trimmed to
        nothing.
      */}
      <dl className="grid grid-cols-2 border-y border-line-inverse">
        <Stat
          term="Spot price"
          value={formatPrice(chart.highlight?.price)}
          unit={PRICE_UNIT}
          swatch="bg-fg-inverse"
        />
        <Stat
          term={active.label}
          value={formatMetricValue(chart.highlight?.metricValue)}
          unit={active.unit}
          swatch={SWATCHES[metric]}
        />
      </dl>

      <PreviewSvg chart={chart} metric={metric} />
    </div>
  );
}

/**
 * A figure, with the line key folded into its label.
 *
 * The card used to carry a footer legend naming both series a third time — after the
 * metric pills and after these labels. Deleting it outright would have lost the one thing
 * it alone said: which colour is which line. So that moved here, onto labels that already
 * existed, and the row went.
 */
function Stat({
  term,
  value,
  unit,
  swatch,
}: {
  term: string;
  value: string;
  unit: string;
  swatch: string;
}) {
  return (
    <div className="flex min-w-0 flex-col gap-1 border-r border-line-inverse px-4 py-3 last:border-r-0">
      <dt className="flex items-center gap-2 truncate font-mono text-[0.6875rem] uppercase tracking-wider text-fg-inverse-muted">
        <span aria-hidden="true" className={`h-0.5 w-3 shrink-0 ${swatch}`} />
        {term}
      </dt>
      <dd className="flex items-baseline gap-1.5">
        {/*
          `lang` on the figure itself. The document is English but every number is
          formatted `nb-NO`, where a comma is the decimal separator — an English screen
          reader voices "1,024" as *one thousand and twenty-four* when the value is
          1.024 NOK/kWh. Marking the run (WCAG 2.2 §3.1.2) makes it read as the number it
          is. It goes on the number alone: the unit beside it is English.
        */}
        <span
          lang={APP_LOCALE}
          className="font-mono text-xl font-semibold tabular-nums"
        >
          {value}
        </span>
        {unit ? (
          <span className="text-xs text-fg-inverse-muted">{unit}</span>
        ) : null}
      </dd>
    </div>
  );
}

/**
 * The chart itself. Decorative — the numbers beside it carry the same values as text —
 * so it is `aria-hidden` rather than duplicating them for a screen reader.
 */
function PreviewSvg({
  chart,
  metric,
}: {
  chart: ReturnType<typeof toPreviewChart>;
  metric: WeatherMetricId;
}) {
  const metricStroke = `var(--chart-${metric})`;

  return (
    <div className="px-2 pb-2 pt-4">
      <svg
        viewBox={`0 0 ${chart.width} ${chart.height + 22}`}
        className="h-auto w-full"
        aria-hidden="true"
        role="presentation"
      >
        <defs>
          {/* Transparent at 78%: a full-height wash was the largest shape on the card. */}
          <linearGradient id="preview-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--fg-inverse)" stopOpacity="0.22" />
            <stop offset="78%" stopColor="var(--fg-inverse)" stopOpacity="0" />
          </linearGradient>

          <linearGradient id="preview-metric-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={metricStroke} stopOpacity="0.28" />
            <stop offset="82%" stopColor={metricStroke} stopOpacity="0" />
          </linearGradient>
        </defs>

        {/*
          Three levels, so the curves read against something. Decorative under SC 1.4.11
          and deliberately far below the line tokens — any stronger and they compete with
          the data drawn over them.
        */}
        {[0.25, 0.5, 0.75].map((fraction) => (
          <line
            key={fraction}
            x1={chart.plotLeft}
            y1={chart.height * fraction}
            x2={chart.plotRight}
            y2={chart.height * fraction}
            stroke="var(--fg-inverse)"
            strokeWidth="0.5"
            opacity="0.08"
          />
        ))}

        {chart.priceArea ? <path d={chart.priceArea} fill="url(#preview-fill)" /> : null}

        {chart.metricLine ? (
          <>
            {chart.metricArea ? (
              <path d={chart.metricArea} fill="url(#preview-metric-fill)" />
            ) : null}

            {/*
              A wide soft stroke under the real one, reading as the line's own glow. This
              is the treatment the bento cards below already use; the hero is the more
              prominent chart and was the flatter of the two.
            */}
            <path
              d={chart.metricLine}
              fill="none"
              stroke={metricStroke}
              strokeWidth="7"
              strokeLinecap="round"
              opacity="0.2"
            />
            <path
              d={chart.metricLine}
              fill="none"
              stroke={metricStroke}
              strokeWidth="2"
              strokeLinecap="round"
            />
          </>
        ) : null}

        <path
          d={chart.priceLine}
          fill="none"
          stroke="var(--fg-inverse)"
          strokeWidth="2"
          strokeLinecap="round"
        />

        {chart.highlight ? (
          <g>
            <line
              x1={chart.highlight.x}
              y1="0"
              x2={chart.highlight.x}
              y2={chart.height}
              stroke="var(--fg-inverse)"
              strokeWidth="1"
              strokeDasharray="3 3"
              opacity="0.5"
            />

            {/*
              The hour the stat strip above is describing, named on the chart itself.
              Without it the crosshair is a line with no stated subject, and the connection
              between the three figures and this position has to be inferred.
            */}
            <g>
              <rect
                x={chart.highlight.x - 15}
                y="0"
                width="30"
                height="15"
                rx="7.5"
                fill="var(--fg-inverse)"
              />
              <text
                x={chart.highlight.x}
                y="11"
                textAnchor="middle"
                fill="var(--surface-deep)"
                fontSize="10"
                fontWeight="600"
                fontFamily="var(--font-mono)"
              >
                {chart.highlight.hourLabel}
              </text>
            </g>

            {chart.highlight.metricY !== null ? (
              <>
                <circle
                  cx={chart.highlight.x}
                  cy={chart.highlight.metricY}
                  r="7"
                  fill={metricStroke}
                  opacity="0.25"
                />
                <circle
                  cx={chart.highlight.x}
                  cy={chart.highlight.metricY}
                  r="3.5"
                  fill="var(--surface-deep)"
                  stroke={metricStroke}
                  strokeWidth="2"
                />
              </>
            ) : null}

            {chart.highlight.priceY !== null ? (
              <>
                <circle
                  cx={chart.highlight.x}
                  cy={chart.highlight.priceY}
                  r="7"
                  fill="var(--fg-inverse)"
                  opacity="0.2"
                />
                <circle
                  cx={chart.highlight.x}
                  cy={chart.highlight.priceY}
                  r="3.5"
                  fill="var(--surface-deep)"
                  stroke="var(--fg-inverse)"
                  strokeWidth="2"
                />
              </>
            ) : null}
          </g>
        ) : null}

        <line
          x1={chart.plotLeft}
          y1={chart.height}
          x2={chart.plotRight}
          y2={chart.height}
          stroke="var(--fg-inverse)"
          strokeWidth="0.5"
          opacity="0.25"
        />

        {chart.ticks.map((tick) => (
          <text
            key={tick.label}
            x={tick.x}
            y={chart.height + 16}
            textAnchor="middle"
            fill="var(--fg-inverse-muted)"
            fontSize="10"
            fontFamily="var(--font-mono)"
          >
            {tick.label}
          </text>
        ))}
      </svg>
    </div>
  );
}
