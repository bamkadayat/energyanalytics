import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { logout } from "@/features/auth";
import { hasValidSession } from "@/features/auth/api/session";
import {
  CorrelationView,
  parseViewParams,
  ViewControls,
} from "@/features/market-correlation";
import { APP_TIME_ZONE, PRICE_AREA, WEATHER_LOCATION } from "@/shared/config";

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
    <div className="mx-auto flex w-full max-w-content flex-col gap-8 px-4 py-8 sm:px-6 sm:py-12">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex flex-col gap-3">
          <h1 className="max-w-2xl text-display font-semibold text-fg">
            Nordic Power &amp; Weather Explorer
          </h1>

          {/*
            These three facts are the caveats the page must never bury: which area the
            prices cover, that Oslo is a single representative point inside it, and which
            clock every hour is stated in.
          */}
          <p className="font-mono text-sm text-fg-muted">
            {PRICE_AREA.label} · {WEATHER_LOCATION.label} weather · {APP_TIME_ZONE}
          </p>
        </div>

        <form action={logout}>
          <button
            type="submit"
            className="rounded-control border border-line-strong px-3 py-1.5 text-sm font-medium text-fg-secondary hover:bg-surface-subtle"
          >
            Sign out
          </button>
        </form>
      </header>

      <ViewControls params={params} />

      <main>
        <Suspense fallback={<LoadingRegion />}>
          <CorrelationView params={params} />
        </Suspense>
      </main>
    </div>
  );
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
