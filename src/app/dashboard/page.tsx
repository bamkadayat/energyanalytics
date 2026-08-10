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
  ScopeLine,
} from "./_components/header-controls";
import { MobileNav } from "./_components/mobile-nav";
import { DataNote } from "./_components/data-note";
import { DashboardSidebar } from "./_components/sidebar";

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
     * Rail plus a full-width work area — the layout that reads as an application rather
     * than a page. The rail carries the filters, so the header can stay thin and the
     * charts get the whole width instead of a centred column.
     */
    <div className="flex min-h-screen bg-page">
      <DashboardSidebar params={params} />

      <div className="flex min-w-0 flex-1 flex-col">
        {/*
          A command bar, not a title bar: it carries the one filter that reaches every
          view on the page, and says which day that filter resolved to. The title it used
          to hold is redundant with the rail beside it.
        */}
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

            <ScopeLine />

            {/*
              One cluster, allowed to shrink. Two `shrink-0` boxes plus a long date ran
              the header past the right edge of a phone — `min-w-0` is what lets the date
              give way, and the chip itself shortens below `sm`.

              The note carries the standing qualifications, one control rather than a
              banner at the foot of the page; in the header it sits above every view it
              qualifies. The date has its own boundary because resolving it reads the
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

