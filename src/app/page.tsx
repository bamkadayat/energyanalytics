import { Suspense } from "react";
import { buttonClasses, Wordmark } from "@/shared/ui";
import { DEFAULT_WEATHER_METRIC, PRICE_AREA } from "@/shared/config";
import Link from "next/link";
import { ClosingCta } from "./_components/closing-cta";
import { HeroPreview } from "./_components/hero-preview";
import { MetricHighlights } from "./_components/metric-highlights";
import { SessionCta, SessionCtaPlaceholder } from "./_components/session-cta";
import { SiteFooter } from "./_components/site-footer";

/**
 * Public landing page.
 *
 * Everything except the call to action is static HTML — including the preview chart,
 * which fetches a **fixed** example day and so needs no clock. Only the session-aware
 * button is request-time, and it sits inside `<Suspense>` so the rest stays in the
 * prerendered shell.
 */
export default function Home() {
  return (
    <div className="flex flex-1 flex-col">
      {/*
        The banner sits outside `<main>`, and everything else inside it — the metric
        section and the closing band were previously outside every landmark, so landmark
        navigation and "skip to content" reached the hero only.
      */}
      <header className="bg-surface-inverse text-fg-inverse">
        <div className="mx-auto flex w-full max-w-content items-center justify-between gap-4 px-4 py-6 sm:px-6">
          <Wordmark tone="inverse" />

          {/*
            Smaller than the hero's button on purpose: the same control at the same size
            twice in one viewport leaves neither of them reading as the primary action.
          */}
          <Suspense fallback={<SessionCtaPlaceholder size="sm" />}>
            <SessionCta size="sm" />
          </Suspense>
        </div>
      </header>

      <main className="flex flex-1 flex-col">
        <div className="bg-surface-inverse text-fg-inverse">
          <section className="mx-auto grid w-full max-w-content items-center gap-12 px-4 pb-10 pt-4 sm:px-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.25fr)] lg:pb-16 lg:pt-8">
            <div className="flex min-w-0 flex-col items-start gap-6">
              {/*
                The last line is muted so the headline has a shape rather than a wall of
                equal weight — the emphasis lands on what the product is, and "hour by
                hour", the unit of analysis, reads as its qualifier.
              */}
              <h1 className="max-w-xl text-hero font-semibold">
                Power prices and weather,{" "}
                <span className="text-fg-inverse-muted">hour by hour</span>
              </h1>

              <p className="max-w-md text-lg leading-relaxed text-fg-inverse-muted">
                Day-ahead spot prices for {PRICE_AREA.label} beside Oslo wind, temperature
                and solar — on one timeline.
              </p>

              <div className="flex flex-wrap items-center gap-3">
                <Suspense
                  fallback={<SessionCtaPlaceholder size="lg" className="sm:w-48" />}
                >
                  <SessionCta
                    size="lg"
                    className="sm:min-w-48"
                    signedOutLabel="Open the dashboard"
                  />
                </Suspense>

                {/*
                  Goes to the section that answers it, rather than nowhere. Ghost, not
                  filled: as a second `inverse` pill it matched the primary exactly, and
                  two equal buttons leave a visitor to guess which one the page wants.
                */}
                <Link
                  href="#how-it-works"
                  className={buttonClasses({ variant: "ghost-inverse", size: "lg" })}
                >
                  How the data is joined
                </Link>
              </div>
            </div>

            {/*
              The metric the dashboard actually opens on. Previewing a different one made
              the hero, the raised card below and the dashboard tell three stories.
            */}
            <HeroPreview metric={DEFAULT_WEATHER_METRIC} />
          </section>
        </div>

        <MetricHighlights />

        <ClosingCta />
      </main>

      <SiteFooter />
    </div>
  );
}
