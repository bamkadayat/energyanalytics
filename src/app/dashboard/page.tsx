import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { hasValidSession } from "@/features/auth/api/session";
import {
  CorrelationView,
  DayViewSkeleton,
  parseViewParams,
  RangeViews,
  RangeViewsSkeleton,
} from "@/features/market-correlation";
import { APP_TIME_ZONE, PRICE_AREA, WEATHER_LOCATION } from "@/shared/config";
import {
  DateChip,
  DateChipPlaceholder,
  DaySwitch,
} from "./_components/header-controls";
import { MobileNav } from "./_components/mobile-nav";
import { DataNote } from "./_components/data-note";
import { DashboardSidebar } from "./_components/sidebar";

export const metadata: Metadata = {
  title: "Dashboard · Nordic Power & Weather Explorer",
};

/**
 * Protected routes are not prerendered. `instant = false` verifies the session before
 * anything renders — and is why `searchParams` may be awaited here, unlike public pages.
 */
export const instant = false;

/**
 * The dashboard. Proxy only checks the cookie's *presence* and is not an authorization
 * layer, so this is where the signature and expiry are actually verified.
 */
export default async function DashboardPage({ searchParams }: PageProps<"/dashboard">) {
  if (!(await hasValidSession())) {
    redirect("/login");
  }

  const params = parseViewParams(await searchParams);

  return (
    /* Rail plus a full-width work area: an application, not a centred page. */
    <div className="flex min-h-screen bg-page">
      <DashboardSidebar params={params} />

      <div className="flex min-w-0 flex-1 flex-col">
        {/* A command bar, not a title bar — the rail beside it carries the name. */}
        <header className="sticky top-0 z-30 border-b border-line bg-surface">
          <div className="flex items-center gap-3 px-4 py-3 sm:px-6">
            <MobileNav params={params} />

            {/*
              Visually hidden. The rail carries the product name; a page still needs an h1
              or the heading outline starts at h2 with a hole in it.
            */}
            <h1 className="sr-only">
              Dashboard — {PRICE_AREA.label} prices and {WEATHER_LOCATION.label} weather,
              by hour in {APP_TIME_ZONE}
            </h1>

            <DaySwitch params={params} />

            {/*
              One cluster with `min-w-0`, so the date gives way rather than running the
              header off a phone. The date has its own boundary: resolving it reads the
              clock.
            */}
            <div className="ml-auto flex min-w-0 items-center gap-1 sm:gap-3">
              <DataNote />

              <Suspense fallback={<DateChipPlaceholder />}>
                <DateChip params={params} />
              </Suspense>
            </div>
          </div>
        </header>

        {/* min-w-0: a flex item defaults to min-width:auto and will not shrink below its
            widest child, which is how one wide table pushes the whole page sideways. */}
        <main className="flex min-w-0 flex-1 flex-col gap-6 px-4 py-6 sm:px-6">
          <section id="day-view" className="scroll-mt-24">
            <Suspense fallback={<DayViewSkeleton />}>
              <CorrelationView params={params} />
            </Suspense>
          </section>

          {/*
            Its own boundary: the range is one price request per day, and making today's
            chart wait on them would be the wrong trade.
          */}
          <section className="scroll-mt-24">
            <Suspense fallback={<RangeViewsSkeleton />}>
              <RangeViews params={params} />
            </Suspense>
          </section>
        </main>
      </div>
    </div>
  );
}

