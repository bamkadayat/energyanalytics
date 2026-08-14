import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { FiArrowLeft } from "react-icons/fi";
import { hasValidSession } from "@/features/auth/api/session";
import {
  HoursTableSkeleton,
  HoursView,
  hrefWith,
  parseViewParams,
} from "@/features/market-correlation";
import { HOURS_TABLE_DAYS } from "@/shared/config";
import { DataNote } from "../_components/data-note";
import { MobileNav } from "../_components/mobile-nav";
import { DashboardSidebar } from "../_components/sidebar";

export const metadata: Metadata = {
  title: "All hours · Nordic Power & Weather Explorer",
};

/** Same reasoning as the dashboard: a protected route is not prerendered. */
export const instant = false;

/**
 * The whole range as one table. The shell is repeated here rather than hoisted into a
 * `layout.tsx`: the rail is search-param aware, and layouts do not receive them.
 */
export default async function HoursPage({ searchParams }: PageProps<"/dashboard/hours">) {
  if (!(await hasValidSession())) {
    redirect("/login");
  }

  const params = parseViewParams(await searchParams);

  return (
    <div className="flex min-h-screen bg-page">
      <DashboardSidebar params={params} active="hours" />

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 border-b border-line bg-surface">
          <div className="flex items-center gap-3 px-4 py-3 sm:px-6">
            <MobileNav params={params} active="hours" />

            <h1 className="min-w-0 truncate text-base font-semibold text-fg">
              All hours
              {/*
                The span is the first thing a narrow header can do without.

                It carried `· NO1 · Europe/Oslo` until 2026-08-14. Both are still stated
                where they are load-bearing — the table's caption names the timezone, and
                `data-note.tsx` carries the area — so the header states only what is
                specific to this page: how much data it is showing.
              */}
              <span className="ml-2 hidden font-mono text-xs font-normal text-fg-muted sm:inline">
                {HOURS_TABLE_DAYS} days
              </span>
            </h1>

            <div className="ml-auto shrink-0">
              <DataNote />
            </div>
          </div>
        </header>

        {/*
          `gap-2`, not `gap-6`: the back link belongs to the heading under it, so it sits
          close enough to read as one block rather than as a stray line above the content.
        */}
        <main className="flex min-w-0 flex-1 flex-col gap-2 px-4 py-6 sm:px-6">
          {/*
            The way back, above the heading it returns you from.

            The rail already links home from its wordmark, but a wordmark reads as a logo,
            and the two `Views` entries above it read as anchors on the page you are
            already on — so from here the rail looked like a "you are here" with no way
            out. Carries the current params, so you return to the view you left.

            Deliberately outside the `Suspense` below: on a cold cache the table takes
            ninety price requests to arrive, and the way out should not be the thing you
            wait for. That is also why it is not in `hours-view.tsx` beside the `h2`.

            No `scroll={false}`: unlike the filters, this is a different page, and holding
            the table's scroll offset would land you partway down the dashboard.
          */}
          <Link
            href={`/dashboard${hrefWith(params, {})}`}
            className="flex w-fit items-center gap-1.5 text-sm text-fg-secondary hover:text-fg"
          >
            <FiArrowLeft aria-hidden="true" className="size-4 shrink-0" />
            Dashboard
          </Link>

          <Suspense fallback={<HoursTableSkeleton />}>
            <HoursView />
          </Suspense>
        </main>
      </div>
    </div>
  );
}
