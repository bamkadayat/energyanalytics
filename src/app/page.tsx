import { Suspense } from "react";
import {
  CorrelationView,
  parseViewParams,
  ViewControls,
} from "@/features/market-correlation";
import { APP_TIME_ZONE, PRICE_AREA, WEATHER_LOCATION } from "@/shared/config";

type SearchParams = PageProps<"/">["searchParams"];

/**
 * Server conductor.
 *
 * `searchParams` is deliberately **not** awaited here. It is a request-time API, and
 * awaiting it at the page level blocks the whole route from prerendering
 * (`blocking-prerender-dynamic`). Instead the promise is passed down and awaited inside
 * `<Suspense>`, so the masthead is static HTML and only the param-dependent regions
 * stream in. See context/library-docs.md.
 *
 * Two boundaries rather than one: the controls need only the URL and resolve instantly,
 * while the data region waits on two providers. Sharing a boundary would hold the
 * controls back for no reason.
 */
export default function Home({ searchParams }: PageProps<"/">) {
  return (
    <div className="mx-auto flex w-full max-w-content flex-col gap-8 px-4 py-8 sm:px-6 sm:py-12">
      <header className="flex flex-col gap-3">
        <h1 className="max-w-2xl text-display font-semibold text-fg">
          Nordic Power &amp; Weather Explorer
        </h1>

        {/*
          These three facts are the caveats the page must never bury: which area the
          prices cover, that Oslo is a single representative point inside it, and which
          clock every hour is stated in. Putting them in the masthead makes the structure
          itself carry the qualification.
        */}
        <p className="font-mono text-sm text-fg-muted">
          {PRICE_AREA.label} · {WEATHER_LOCATION.label} weather · {APP_TIME_ZONE}
        </p>
      </header>

      <Suspense fallback={<ControlsPlaceholder />}>
        <Controls searchParams={searchParams} />
      </Suspense>

      <main>
        <Suspense fallback={<LoadingRegion />}>
          <DataRegion searchParams={searchParams} />
        </Suspense>
      </main>
    </div>
  );
}

async function Controls({ searchParams }: { searchParams: SearchParams }) {
  return <ViewControls params={parseViewParams(await searchParams)} />;
}

async function DataRegion({ searchParams }: { searchParams: SearchParams }) {
  return <CorrelationView params={parseViewParams(await searchParams)} />;
}

/** Reserves the controls' height so the masthead does not jump when they resolve. */
function ControlsPlaceholder() {
  return <div className="h-16" aria-hidden="true" />;
}

/**
 * Says what is being waited for rather than spinning. Its height roughly matches the
 * loaded region so the page does not jump when the data arrives.
 */
function LoadingRegion() {
  return (
    <div
      className="flex min-h-[var(--chart-min-height)] flex-col gap-4 rounded-card border border-line bg-surface p-6"
      aria-busy="true"
    >
      <p className="text-fg-muted">Loading prices and weather…</p>
      <div className="h-4 w-2/3 rounded-control bg-surface-subtle" />
      <div className="h-4 w-1/2 rounded-control bg-surface-subtle" />
      <div className="h-4 w-3/5 rounded-control bg-surface-subtle" />
    </div>
  );
}
