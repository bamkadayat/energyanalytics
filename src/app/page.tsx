import Link from "next/link";
import {
  APP_TIME_ZONE,
  PRICE_AREA,
  PRICE_UNIT,
  WEATHER_LOCATION,
  WEATHER_METRICS,
  WEATHER_METRIC_IDS,
} from "@/shared/config";

/**
 * Public landing page.
 *
 * Fully static — it reads no request-time API, so it prerenders completely and is the
 * fastest thing in the app. The dashboard behind it is the opposite by necessity.
 */
export default function Home() {
  return (
    <div className="flex flex-1 flex-col bg-surface-inverse text-fg-inverse">
      <header className="mx-auto flex w-full max-w-content items-center justify-between gap-4 px-4 py-6 sm:px-6">
        <span className="font-mono text-sm font-medium tracking-tight">
          {PRICE_AREA.code}
          <span className="text-fg-inverse-muted"> / {WEATHER_LOCATION.label}</span>
        </span>

        {/*
          The only control on the page, so it is the only thing styled as one. A white
          pill against the navy field carries maximum contrast without introducing a
          colour the token system does not have.
        */}
        <Link
          href="/login"
          className="rounded-pill bg-surface px-5 py-2 text-sm font-medium text-fg hover:bg-surface-subtle"
        >
          Log in
        </Link>
      </header>

      <main className="mx-auto grid w-full max-w-content flex-1 items-center gap-12 px-4 py-16 sm:px-6 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)] lg:py-24">
        <div className="flex flex-col gap-6">
          <h1 className="max-w-3xl text-display font-semibold leading-tight">
            What Norwegian power prices did today, hour by hour — next to the weather
            over Oslo
          </h1>

          <p className="max-w-xl text-lg text-fg-inverse-muted">
            Day-ahead spot prices for {PRICE_AREA.label} aligned with hourly wind,
            temperature and solar readings on a shared timeline. Explore how they move
            together, without claiming one causes the other.
          </p>
        </div>

        {/*
          Deliberately not a stock photograph or an illustrative chart. Inventing a price
          curve for decoration would put fabricated market data on the marketing page of
          a tool whose entire premise is not fabricating market data. These are the real
          parameters of what the dashboard covers.
        */}
        <dl className="grid gap-px overflow-hidden rounded-card border border-line-strong bg-line-strong sm:grid-cols-2">
          <Fact term="Price area" value={PRICE_AREA.label} />
          <Fact term="Weather point" value={`${WEATHER_LOCATION.label} (representative)`} />
          <Fact term="Resolution" value={`Hourly · ${APP_TIME_ZONE}`} />
          <Fact term="Price unit" value={PRICE_UNIT} />
          <Fact
            term="Weather metrics"
            value={WEATHER_METRIC_IDS.map((id) => WEATHER_METRICS[id].label).join(" · ")}
            wide
          />
        </dl>
      </main>

      <footer className="mx-auto w-full max-w-content px-4 pb-10 sm:px-6">
        <p className="max-w-2xl font-mono text-xs text-fg-inverse-muted">
          Prices exclude VAT, grid charges and other consumer costs. Oslo weather is a
          representative location within {PRICE_AREA.code}, and relationships shown are
          exploratory rather than causal.
        </p>
      </footer>
    </div>
  );
}

function Fact({
  term,
  value,
  wide = false,
}: {
  term: string;
  value: string;
  wide?: boolean;
}) {
  return (
    <div
      className={`flex flex-col gap-1 bg-surface-inverse p-4 ${wide ? "sm:col-span-2" : ""}`}
    >
      <dt className="font-mono text-xs uppercase tracking-wider text-fg-inverse-muted">
        {term}
      </dt>
      <dd className="text-sm font-medium">{value}</dd>
    </div>
  );
}
