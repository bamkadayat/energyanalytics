import { Wordmark } from "@/shared/ui";
import { PRICE_AREA, PRICE_UNIT, WEATHER_LOCATION } from "@/shared/config";

/**
 * Landing page footer.
 *
 * This is where the qualifications live now that they are off the hero: they belong with
 * the small print rather than beside a headline, but they still have to appear on any
 * page that describes the data. The dashboard states them again, next to the actual
 * numbers.
 *
 * Deliberately no copyright year. `new Date().getFullYear()` in a server component fails
 * the build under Cache Components with `blocking-prerender-current-time` — the same trap
 * hit in the auth slice — and a year hard-coded today is wrong in January.
 */
export function SiteFooter() {
  return (
    <footer className="border-t border-line bg-page">
      <div className="mx-auto flex w-full max-w-content flex-col gap-6 px-4 py-10 sm:px-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <Wordmark />

          <p className="break-words font-mono text-xs text-fg-muted">
            Data:{" "}
            <a
              href="https://www.hvakosterstrommen.no"
              className="text-link underline underline-offset-2"
            >
              hvakosterstrommen.no
            </a>{" "}
            ·{" "}
            <a
              href="https://open-meteo.com"
              className="text-link underline underline-offset-2"
            >
              open-meteo.com
            </a>
          </p>
        </div>

        <p className="max-w-3xl text-pretty text-xs leading-relaxed text-fg-muted">
          Prices are day-ahead spot prices in {PRICE_UNIT} and exclude VAT, grid charges
          and other consumer costs. {WEATHER_LOCATION.label} weather is a representative
          location within {PRICE_AREA.code}, not a regional average. Relationships shown
          are exploratory and do not demonstrate causation.
        </p>
      </div>
    </footer>
  );
}
