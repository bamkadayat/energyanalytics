import Link from "next/link";
import { Wordmark } from "@/shared/ui";
import { HeroVisual } from "./_components/hero-visual";
import { PRICE_AREA } from "@/shared/config";

/**
 * Public landing page.
 *
 * Fully static — it reads no request-time API, so it prerenders completely and is the
 * fastest thing in the app. The dashboard behind it is the opposite by necessity.
 */
export default function Home() {
  return (
    <div className="flex flex-1 flex-col bg-surface-inverse text-fg-inverse">
      <header className="mx-auto flex w-full max-w-content items-center justify-between gap-4 px-4 py-6 sm:px-6">
        <Wordmark tone="inverse" />

        {/*
          The only control on the page, so it is the only thing styled as one. A white
          pill against the navy field carries maximum contrast without introducing a
          colour the token system does not have.
        */}
        <Link
          href="/login"
          className="rounded-pill bg-surface px-5 py-2 text-sm font-medium text-fg hover:bg-surface-subtle"
        >
          Log in
        </Link>
      </header>

      <main className="mx-auto grid w-full max-w-content flex-1 items-center gap-12 px-4 py-16 sm:px-6 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)] lg:py-24">
        <div className="flex flex-col gap-5">
          <h1 className="max-w-lg text-display font-semibold leading-tight">
            Power prices and weather, hour by hour
          </h1>

          {/*
            One sentence. The non-causation caveat lives in the footnote below rather
            than here — saying it twice on one screen makes it read as a disclaimer
            instead of a design principle.
          */}
          <p className="max-w-md text-lg text-fg-inverse-muted">
            Day-ahead spot prices for {PRICE_AREA.label}, aligned with Oslo wind,
            temperature and solar on one timeline.
          </p>
        </div>

        {/*
          Drop a licensed clip into public/ and pass videoSrc to swap the animation for
          it; nothing else needs to change.
        */}
        <HeroVisual />
      </main>

      <footer className="mx-auto w-full max-w-content px-4 pb-10 sm:px-6">
        <p className="max-w-2xl font-mono text-xs text-fg-inverse-muted">
          Prices exclude VAT, grid charges and other consumer costs. Oslo weather is a
          representative location within {PRICE_AREA.code}, and relationships shown are
          exploratory rather than causal.
        </p>
      </footer>
    </div>
  );
}
