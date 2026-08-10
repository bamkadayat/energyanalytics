import { Suspense } from "react";
import { buttonClasses, Wordmark } from "@/shared/ui";
import { APP_TIME_ZONE, PRICE_AREA, PRICE_UNIT } from "@/shared/config";
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
      <div className="flex flex-col bg-surface-inverse text-fg-inverse">
        <header className="mx-auto flex w-full max-w-content items-center justify-between gap-4 px-4 py-6 sm:px-6">
          <Wordmark tone="inverse" />

          <Suspense fallback={<SessionCtaPlaceholder size="lg" />}>
            <SessionCta size="lg" />
          </Suspense>
        </header>

        <main className="mx-auto grid w-full max-w-content items-center gap-12 px-4 py-10 sm:px-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.25fr)] lg:py-16">
          <div className="flex min-w-0 flex-col items-start gap-6">
            {/* States the contract up front: which market, what resolution, what unit. */}
            <p className="font-mono text-xs uppercase tracking-[0.18em] text-fg-inverse-muted">
              Day-ahead · Hourly · {PRICE_UNIT}
            </p>

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
              Day-ahead spot prices for {PRICE_AREA.label} on one timeline with Oslo wind,
              temperature and solar radiation. Read them together, hour for hour.
            </p>

            <div className="flex flex-wrap items-center gap-3">
              <Suspense fallback={<SessionCtaPlaceholder size="lg" />}>
                <SessionCta size="lg" className="sm:min-w-40" />
              </Suspense>

              {/* Goes to the section that answers it, rather than nowhere. */}
              <Link
                href="#how-it-works"
                className={buttonClasses({ variant: "inverse", size: "lg" })}
              >
                How the data is joined
              </Link>
            </div>

            <div className="flex flex-col gap-1 font-mono text-xs text-fg-inverse-muted">
              <p>
                Prices{" "}
                <a
                  href="https://www.hvakosterstrommen.no"
                  className="underline underline-offset-4"
                >
                  hvakosterstrommen.no
                </a>
              </p>
              <p>
                Weather{" "}
                <a href="https://open-meteo.com" className="underline underline-offset-4">
                  open-meteo.com
                </a>{" "}
                · {APP_TIME_ZONE}
              </p>
            </div>
          </div>

          <HeroPreview metric="solar" />
        </main>
      </div>

      <MetricHighlights />

      <ClosingCta />

      <SiteFooter />
    </div>
  );
}
