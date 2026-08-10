import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { logout } from "@/features/auth";
import { hasValidSession } from "@/features/auth/api/session";
import {
  CorrelationView,
  parseViewParams,
  RangeViews,
  ViewControls,
} from "@/features/market-correlation";
import { APP_TIME_ZONE, PRICE_AREA, WEATHER_LOCATION } from "@/shared/config";
import { Button, Wordmark } from "@/shared/ui";

export const metadata: Metadata = {
  title: "Dashboard · Nordic Power & Weather Explorer",
};

/**
 * Protected routes are not prerendered.
 *
 * `instant = false` opts this route out of the static shell so the session can be
 * verified before anything renders. Prerendering a shell of a page the visitor may not
 * be allowed to see would be the wrong default here, and it is the reason `searchParams`
 * can be awaited at the top of this component while the public pages must not.
 */
export const instant = false;

/**
 * The dashboard.
 *
 * Proxy already redirects visitors without a session cookie, but that check only looks
 * for the cookie's *presence* — Next's docs are explicit that Proxy is not an
 * authorization layer. This is the check that actually verifies the signature and
 * expiry, so a forged or expired cookie gets no data.
 */
export default async function DashboardPage({ searchParams }: PageProps<"/dashboard">) {
  if (!(await hasValidSession())) {
    redirect("/login");
  }

  const params = parseViewParams(await searchParams);

  return (
    /*
     * An application shell rather than a document: a sticky bar that keeps identity,
     * filters and sign-out in reach while the data scrolls. In an analytics tool the
     * filters are used constantly, and a header that scrolls away makes every change of
     * view a scroll to the top and back.
     */
    <div className="flex min-h-screen flex-col bg-page">
      <header className="sticky top-0 z-30 border-b border-line bg-surface">
        <div className="mx-auto flex w-full max-w-content flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <div className="flex items-center gap-4">
            <Wordmark />

            {/*
              Visually hidden. The wordmark carries the product name; a page still needs
              an h1 or the heading outline starts at h2 with a hole in it.
            */}
            <h1 className="sr-only">
              Dashboard — {PRICE_AREA.label} prices and {WEATHER_LOCATION.label} weather
            </h1>

            {/*
              The three caveats this page must never bury: which area the prices cover,
              that Oslo is one representative point inside it, and which clock every hour
              is stated in. As header chips they stay on screen rather than scrolling away.
            */}
            <p className="hidden font-mono text-xs text-fg-muted lg:block">
              {PRICE_AREA.label} · {WEATHER_LOCATION.label} weather · {APP_TIME_ZONE}
            </p>
          </div>

          <form action={logout}>
            <Button type="submit" variant="outline" size="sm">
              Logout
            </Button>
          </form>
        </div>

        <div className="border-t border-line bg-surface">
          <div className="mx-auto w-full max-w-content px-4 py-2.5 sm:px-6">
            <ViewControls params={params} />
          </div>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-content flex-1 flex-col gap-6 px-4 py-6 sm:px-6">
        <Suspense fallback={<LoadingRegion />}>
          <CorrelationView params={params} />
        </Suspense>

        {/*
          Its own boundary: the 30-day range is 30 price requests, and making today's
          chart wait on them would be the wrong trade.
        */}
        <Suspense fallback={<LoadingRegion label="Loading the last 30 days…" />}>
          <RangeViews params={params} />
        </Suspense>
      </main>
    </div>
  );
}

/**
 * Says what is being waited for rather than spinning. Its height roughly matches the
 * loaded region so the page does not jump when the data arrives.
 */
function LoadingRegion({ label = "Loading prices and weather…" }: { label?: string }) {
  return (
    <div
      className="flex min-h-[var(--chart-min-height)] flex-col gap-4 rounded-card border border-line bg-surface p-6"
      aria-busy="true"
    >
      <p className="text-fg-muted">{label}</p>
      <div className="h-4 w-2/3 rounded-control bg-surface-subtle" />
      <div className="h-4 w-1/2 rounded-control bg-surface-subtle" />
      <div className="h-4 w-3/5 rounded-control bg-surface-subtle" />
    </div>
  );
}
