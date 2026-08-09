import { Suspense } from "react";
import { LogoMark } from "@/shared/ui";
import { SessionCta, SessionCtaPlaceholder } from "./session-cta";

/**
 * Closing band: a navy panel inset from the page edges, restating the offer with the
 * same session-aware button used in the navbar and hero.
 *
 * The copy is about provenance rather than persuasion, because that is the honest claim
 * this project can make — the numbers are public, the join is explained, and gaps are
 * shown rather than filled in.
 */
export function ClosingCta() {
  return (
    <section className="bg-page pb-16 sm:pb-24">
      <div className="mx-auto w-full max-w-content px-4 sm:px-6">
        <div className="animate-reveal relative overflow-hidden rounded-card bg-surface-inverse px-6 py-16 text-center text-fg-inverse sm:px-12 sm:py-20">
          {/*
            The mark itself, oversized and bled off both edges, instead of stock imagery.
            At 5% it reads as texture rather than as a logo repeated three times on one
            page.
          */}
          <LogoMark className="pointer-events-none absolute -left-20 top-1/2 size-96 -translate-y-1/2 opacity-5" />
          <LogoMark className="pointer-events-none absolute -right-24 top-1/2 size-96 -translate-y-1/2 -scale-x-100 opacity-5" />

          <div className="relative mx-auto flex max-w-2xl flex-col items-center gap-5">
            <h2 className="text-balance text-display font-semibold">
              Every number traces back to its source
            </h2>

            <p className="max-w-xl text-pretty text-lg text-fg-inverse-muted">
              Public day-ahead prices and public weather readings, joined on the hour.
              Where a reading is missing it stays missing, and the page tells you so.
            </p>

            <div className="mt-2">
              <Suspense
                fallback={<SessionCtaPlaceholder size="lg" className="sm:w-48" />}
              >
                <SessionCta size="lg" className="sm:min-w-48" />
              </Suspense>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
