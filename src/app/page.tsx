import { Suspense } from "react";
import { Wordmark } from "@/shared/ui";
import { PRICE_AREA } from "@/shared/config";
import { HeroCta, HeroCtaPlaceholder } from "./_components/hero-cta";
import { HeroVisual } from "./_components/hero-visual";

/**
 * Public landing page.
 *
 * Everything except the call to action is static HTML. The button reads the session, so
 * it is mounted inside `<Suspense>` — that keeps the headline, subtitle and visual in
 * the prerendered shell instead of making the whole page dynamic for one control.
 */
export default function Home() {
  return (
    <div className="flex flex-1 flex-col bg-surface-inverse text-fg-inverse">
      <header className="mx-auto w-full max-w-content px-4 py-6 sm:px-6">
        <Wordmark tone="inverse" />
      </header>

      <main className="mx-auto grid w-full max-w-content flex-1 items-center gap-12 px-4 py-12 sm:px-6 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)] lg:py-20">
        <div className="flex flex-col items-start gap-6">
          <h1 className="max-w-xl text-hero font-semibold">
            Power prices and weather, hour by hour
          </h1>

          <p className="max-w-md text-lg leading-relaxed text-fg-inverse-muted">
            Day-ahead spot prices for {PRICE_AREA.label}, aligned with Oslo wind,
            temperature and solar on one timeline.
          </p>

          {/*
            The page's only control. Its label depends on the session, so it streams in
            while the rest of the hero is already on screen.
          */}
          <div className="mt-2">
            <Suspense fallback={<HeroCtaPlaceholder />}>
              <HeroCta />
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
  );
}
