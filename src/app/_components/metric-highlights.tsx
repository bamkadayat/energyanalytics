import Link from "next/link";
import { FiArrowRight } from "react-icons/fi";
import {
  WEATHER_METRICS,
  WEATHER_METRIC_IDS,
  type WeatherMetricId,
} from "@/shared/config";

/**
 * The three weather metrics, as three ways into the product.
 *
 * Each card links to the dashboard **already filtered to that metric** — a real, working
 * URL rather than a "Read more" pointing at a page that does not exist. A signed-out
 * visitor is redirected to sign in, which is the expected behaviour for a protected view.
 *
 * Copy stays descriptive. These cards say what is plotted next to what; none claims that
 * weather moves prices, because this project has no basis for that and says so
 * everywhere else.
 */

const DESCRIPTIONS: Record<WeatherMetricId, string> = {
  wind: "Wind speed over Oslo on the same hourly timeline as day-ahead spot prices, for today or tomorrow.",
  temperature:
    "Hourly temperature beside the price curve, so you can see where the two happen to move together.",
  solar:
    "Shortwave radiation across daylight hours, next to what electricity cost in the same hour.",
};

/** The default metric leads, so the featured card is the one the dashboard opens on. */
const FEATURED: WeatherMetricId = "wind";

export function MetricHighlights() {
  return (
    <section className="bg-page py-16 sm:py-24">
      <div className="mx-auto w-full max-w-content px-4 sm:px-6">
        <h2 className="mx-auto max-w-2xl text-balance text-center text-display font-semibold text-fg">
          The same 24 hours, three ways to read them
        </h2>

        {/*
          `items-center` so the two shorter cards sit centred against the taller featured
          one, which is what gives the middle card its lift rather than a shadow.
        */}
        <ul className="mt-12 grid gap-6 lg:grid-cols-3 lg:items-center">
          {WEATHER_METRIC_IDS.map((id) => (
            <MetricCard key={id} id={id} featured={id === FEATURED} />
          ))}
        </ul>
      </div>
    </section>
  );
}

function MetricCard({ id, featured }: { id: WeatherMetricId; featured: boolean }) {
  const metric = WEATHER_METRICS[id];

  return (
    <li
      className={`relative flex min-h-80 flex-col overflow-hidden rounded-card p-6 sm:p-8 ${
        featured
          ? "bg-surface-inverse text-fg-inverse lg:min-h-[26rem]"
          : "bg-surface-selected text-fg lg:min-h-96"
      }`}
    >
      {/*
        Iconographic rather than a chart. A stylised price curve here would put invented
        market data on the marketing page, which is the one thing this product must not
        do — so each card carries the instrument, not a reading.
      */}
      <MetricMotif id={id} featured={featured} />

      <div className="relative flex flex-1 flex-col gap-4">
        <h3 className="text-2xl font-semibold">{metric.label}</h3>

        <p
          className={`max-w-xs text-pretty ${
            featured ? "text-fg-inverse-muted" : "text-fg-secondary"
          }`}
        >
          {DESCRIPTIONS[id]}
        </p>

        <Link
          href={`/dashboard?day=today&metric=${id}`}
          /*
           * The global focus ring is near-black navy and would be invisible on the
           * featured card, so that one overrides the outline colour — the same problem
           * the buttons solve through --btn-ring-color.
           */
          className={`mt-auto inline-flex items-center gap-3 self-start font-medium underline-offset-4 hover:underline ${
            featured ? "focus-visible:outline-fg-inverse" : ""
          }`}
        >
          <FiArrowRight aria-hidden="true" className="size-5 shrink-0" />
          Open the {metric.label.toLowerCase()} view
        </Link>
      </div>
    </li>
  );
}

/**
 * Decorative artwork, bleeding off the bottom-right corner as in the reference.
 *
 * Drawn in the metric's own chart colour, so a card and its series on the dashboard read
 * as the same thing.
 */
function MetricMotif({ id, featured }: { id: WeatherMetricId; featured: boolean }) {
  const tint: Record<WeatherMetricId, string> = {
    wind: "text-chart-wind",
    temperature: "text-chart-temperature",
    solar: "text-chart-solar",
  };

  return (
    <span
      aria-hidden="true"
      className={`pointer-events-none absolute -bottom-8 -right-6 size-56 ${tint[id]} ${
        featured ? "opacity-60" : "opacity-40"
      }`}
    >
      <svg
        viewBox="0 0 100 100"
        fill="none"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="size-full"
      >
        {id === "wind" ? <WindGlyph /> : null}
        {id === "temperature" ? <TemperatureGlyph /> : null}
        {id === "solar" ? <SolarGlyph /> : null}
      </svg>
    </span>
  );
}

/** Gust curls, echoing the logo mark. */
function WindGlyph() {
  return (
    <>
      <path d="M8 30h34a9 9 0 1 0-9-9" />
      <path d="M8 50h48a9 9 0 1 1-9 9" />
      <path d="M8 70h30a8 8 0 1 1-8 8" />
    </>
  );
}

/** A thermometer, read as the instrument rather than a value. */
function TemperatureGlyph() {
  return (
    <>
      <path d="M50 20a9 9 0 0 1 18 0v38a17 17 0 1 1-18 0z" />
      <path d="M59 40v26" />
      <path d="M74 30h12M74 44h8M74 58h12" />
    </>
  );
}

/** A sun with rays. */
function SolarGlyph() {
  return (
    <>
      <circle cx="52" cy="52" r="18" />
      <path d="M52 18v10M52 76v10M18 52h10M76 52h10M28 28l7 7M69 69l7 7M76 28l-7 7M35 69l-7 7" />
    </>
  );
}
