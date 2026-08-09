import { Suspense } from "react";
import { Wordmark } from "@/shared/ui";
import { PRICE_AREA } from "@/shared/config";
import { HeroVisual } from "./_components/hero-visual";
import { MetricHighlights } from "./_components/metric-highlights";
import { SessionCta, SessionCtaPlaceholder } from "./_components/session-cta";

/**
 * Public landing page.
 *
 * Everything except the two calls to action is static HTML. Both read the session, so
 * each is mounted inside `<Suspense>` — that keeps the headline, subtitle, visual and
 * the section below in the prerendered shell instead of making the whole page dynamic
 * for two buttons.
 */
export default function Home() {
  return (
    <div className="flex flex-1 flex-col">
      {/* The navy band: navbar and hero share one surface. */}
      <div className="flex flex-col bg-surface-inverse text-fg-inverse">
        <header className="mx-auto flex w-full max-w-content items-center justify-between gap-4 px-4 py-6 sm:px-6">
          <Wordmark tone="inverse" />

          {/* Persistent entry point, always in reach as the page scrolls. */}
          <Suspense fallback={<SessionCtaPlaceholder size="lg" />}>
            <SessionCta size="lg" />
          </Suspense>
        </header>

        {/*
          A minimum height rather than flex-1: with a section below, the hero should have
          presence without being forced to fill whatever space is left over.
        */}
        <main className="mx-auto grid w-full max-w-content items-center gap-12 px-4 py-12 sm:px-6 lg:min-h-[34rem] lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)] lg:py-20">
          <div className="flex flex-col items-start gap-6">
            <h1 className="max-w-xl text-hero font-semibold">
              Power prices and weather, hour by hour
            </h1>

            <p className="max-w-md text-lg leading-relaxed text-fg-inverse-muted">
              Day-ahead spot prices for {PRICE_AREA.label}, aligned with Oslo wind,
              temperature and solar on one timeline.
            </p>

            {/*
              The primary call to action. Same component as the navbar, so the two can
              never disagree about whether you are signed in.
            */}
            <div className="mt-2">
              <Suspense
                fallback={<SessionCtaPlaceholder size="lg" className="sm:w-48" />}
              >
                <SessionCta size="lg" className="sm:min-w-48" />
              </Suspense>
            </div>
          </div>

          {/*
            Drop a licensed clip into public/ and pass videoSrc to swap the animation for
            it; nothing else needs to change.
          */}
          <HeroVisual />
        </main>
      </div>

      <MetricHighlights />
    </div>
  );
}
