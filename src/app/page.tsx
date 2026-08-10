import { Suspense } from "react";
import { FiArrowRight } from "react-icons/fi";
import { Wordmark } from "@/shared/ui";
import { DEFAULT_WEATHER_METRIC, PRICE_AREA } from "@/shared/config";
import Link from "next/link";
import { ClosingCta } from "./_components/closing-cta";
import { HeroPreview } from "./_components/hero-preview";
import { MetricHighlights } from "./_components/metric-highlights";
import { SessionCta, SessionCtaPlaceholder } from "./_components/session-cta";
import { SiteFooter } from "./_components/site-footer";

/**
 * Public landing page. Everything but the session-aware button is static — the preview
 * chart fetches a fixed example day, so it needs no clock and still prerenders.
 */
export default function Home() {
  return (
    <div className="flex flex-1 flex-col">
      {/* Banner outside `<main>`, everything else inside: the rest of the page used to
          sit outside every landmark, where "skip to content" could not reach it. */}
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
          {/*
            Fills 70% of the viewport, with the content centred in it.

            `svh` rather than `vh`: on mobile `vh` resolves against the *largest* viewport,
            so the hero would sit taller than the screen until the browser chrome
            retracted. `min-h` rather than `h` so the section still grows past 80% when the
            content needs it — at 200% zoom, or on a short landscape phone, a fixed height
            would clip the headline and the CTAs rather than reflow.
          */}
          <section className="mx-auto grid min-h-[70svh] w-full max-w-content content-center items-center gap-12 px-4 pb-10 pt-4 sm:px-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.25fr)] lg:pb-16 lg:pt-8">
            <div className="flex min-w-0 flex-col items-start gap-6">
              {/* The last line is muted, so the headline has a shape. */}
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
                  A text link with an arrow, not a second pill. Even as a ghost it read as
                  a peer of the primary button, and two controls of equal weight leave a
                  visitor to work out which one the page wants.

                  The arrow is the affordance, which is what lets the underline come off at
                  rest — `ui-rules.md` requires the underline because `--link` is
                  near-indistinguishable from body text by colour, and a directional glyph
                  answers that same requirement with a second, non-colour signal. This is
                  the pattern the metric cards below already use.

                  Focus ring overridden: on the navy band the global `--focus` is invisible.
                */}
                <Link
                  href="#how-it-works"
                  className="group inline-flex items-center gap-2.5 px-2 py-2.5 font-medium text-fg-inverse focus-visible:outline-fg-inverse"
                >
                  <span className="underline-offset-4 group-hover:underline">
                    How the data is joined
                  </span>

                  {/* Transitions collapse under prefers-reduced-motion in the base layer. */}
                  <FiArrowRight
                    aria-hidden="true"
                    className="size-5 shrink-0 transition-transform duration-200 group-hover:translate-x-1"
                  />
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
