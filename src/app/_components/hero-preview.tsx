import Link from "next/link";
import { getSettledPrices } from "@/features/energy-prices";
import { getWeather } from "@/features/weather-forecast";
import {
  alignPriceAndWeather,
  toPreviewChart,
} from "@/features/market-correlation";
import {
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
 * **Real market data, not a mock-up.** The day is a fixed constant, so no clock is
 * involved and the whole thing prerenders — a decorative chart has no business making the
 * marketing page request-time. It is labelled as an example day because that is what it
 * is, and the shape is genuinely what happened.
 *
 * Drawn as inline SVG rather than ECharts: this is a static picture, and shipping a
 * charting library to a landing page would cost it the speed that is its main job.
 *
 * The metric pills are links into the real dashboard view for that metric — they look
 * like controls and they behave like them, rather than being decoration that ignores a
 * click.
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
    <div className="overflow-hidden rounded-card border border-line-strong bg-navy-deep text-fg-inverse">
      <header className="flex flex-wrap items-center justify-between gap-3 p-3">
        <ul className="flex gap-1 rounded-pill bg-surface-inverse p-1">
          {WEATHER_METRIC_IDS.map((id) => (
            <li key={id}>
              <Link
                href={`/dashboard?day=today&metric=${id}`}
                aria-current={id === metric ? "true" : undefined}
                className={`flex items-center gap-2 rounded-pill px-3 py-1.5 text-sm ${
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

        <p className="font-mono text-[0.6875rem] uppercase tracking-wider text-fg-inverse-muted">
          Example day · {PREVIEW_DAY.day}.{PREVIEW_DAY.month}.{PREVIEW_DAY.year}
        </p>
      </header>

      <dl className="grid grid-cols-3 border-y border-line-strong">
        <Stat term="Hour" value={chart.highlight?.hourLabel ?? "—"} unit="" />
        <Stat
          term="Spot price"
          value={formatPrice(chart.highlight?.price)}
          unit={PRICE_UNIT}
        />
        <Stat
          term={active.label}
          value={formatMetricValue(chart.highlight?.metricValue)}
          unit={active.unit}
        />
      </dl>

      <PreviewSvg chart={chart} metric={metric} />

      <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-line-strong px-4 py-3 font-mono text-[0.6875rem] text-fg-inverse-muted">
        <span className="flex flex-wrap items-center gap-4">
          <Key className="bg-fg-inverse" label="Spot price" />
          <Key className={SWATCHES[metric]} label={active.label} />
        </span>
        {/* Says what it is. The shape is what happened, not an illustration of it. */}
        <span>Real market data · fixed example day</span>
      </footer>
    </div>
  );
}

function Stat({ term, value, unit }: { term: string; value: string; unit: string }) {
  return (
    <div className="flex min-w-0 flex-col gap-1 border-r border-line-strong px-4 py-3 last:border-r-0">
      <dt className="truncate font-mono text-[0.6875rem] uppercase tracking-wider text-fg-inverse-muted">
        {term}
      </dt>
      <dd className="flex items-baseline gap-1.5">
        <span className="font-mono text-xl font-semibold tabular-nums">{value}</span>
        {unit ? (
          <span className="text-xs text-fg-inverse-muted">{unit}</span>
        ) : null}
      </dd>
    </div>
  );
}

function Key({ className, label }: { className: string; label: string }) {
  return (
    <span className="flex items-center gap-2">
      <span aria-hidden="true" className={`h-0.5 w-4 ${className}`} />
      {label}
    </span>
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
          <linearGradient id="preview-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--fg-inverse)" stopOpacity="0.18" />
            <stop offset="100%" stopColor="var(--fg-inverse)" stopOpacity="0" />
          </linearGradient>
        </defs>

        {chart.priceArea ? <path d={chart.priceArea} fill="url(#preview-fill)" /> : null}

        {chart.metricLine ? (
          <path
            d={chart.metricLine}
            fill="none"
            stroke={metricStroke}
            strokeWidth="1.75"
            strokeLinecap="round"
          />
        ) : null}

        <path
          d={chart.priceLine}
          fill="none"
          stroke="var(--fg-inverse)"
          strokeWidth="1.75"
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
            {chart.highlight.metricY !== null ? (
              <circle
                cx={chart.highlight.x}
                cy={chart.highlight.metricY}
                r="3.5"
                fill="var(--navy-deep, var(--surface-deep))"
                stroke={metricStroke}
                strokeWidth="1.75"
              />
            ) : null}
            {chart.highlight.priceY !== null ? (
              <circle
                cx={chart.highlight.x}
                cy={chart.highlight.priceY}
                r="3.5"
                fill="var(--surface-deep)"
                stroke="var(--fg-inverse)"
                strokeWidth="1.75"
              />
            ) : null}
          </g>
        ) : null}

        <line
          x1="0"
          y1={chart.height}
          x2={chart.width}
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
