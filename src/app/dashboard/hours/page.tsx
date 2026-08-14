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
              <span className="ml-2 hidden font-mono text-xs font-normal text-fg-muted sm:inline">
                {HOURS_TABLE_DAYS} days
              </span>
            </h1>

            <div className="ml-auto shrink-0">
              <DataNote />
            </div>
          </div>
        </header>

        {/* `gap-2` so the back link reads as part of the heading below it. */}
        <main className="flex min-w-0 flex-1 flex-col gap-2 px-4 py-6 sm:px-6">
          {/*
            Outside the `Suspense`: on a cold cache the table is ninety price requests
            away, and the way out should not be what you wait for. Keeps the current
            params, and scrolls to top — this is a different page, not a filter.
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
