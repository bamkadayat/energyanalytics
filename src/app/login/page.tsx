import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { FiArrowLeft } from "react-icons/fi";
import { LoginForm } from "@/features/auth";
import { hasValidSession } from "@/features/auth/api/session";
import { getSettledPrices } from "@/features/energy-prices";
import { alignPriceAndWeather, toPreviewChart } from "@/features/market-correlation";
import { PREVIEW_DAY, PRICE_AREA, WEATHER_LOCATION } from "@/shared/config";
import { LogoMark } from "@/shared/ui";

export const metadata: Metadata = {
  title: "Login · Nordic Power & Weather Explorer",
};

/** Reading the session is request-time work, so this route is allowed to block. */
export const instant = false;

/**
 * Login page.
 *
 * Carries only the controls this app has: one field, one action. No email, no "forgot
 * password", no social login — with a single shared password none of them could do
 * anything, and a control that cannot work is worse than a missing one. The copy says so
 * outright rather than leaving the absence unexplained.
 */
export default async function LoginPage() {
  /*
   * Already signed in? Go straight to the dashboard. Showing a login form to someone who
   * is logged in is a dead end — the form's only outcome is the page they are being kept
   * from.
   *
   * This verifies signature and expiry rather than merely checking the cookie exists.
   * Doing it optimistically would loop on an expired cookie: proxy sees a cookie and
   * sends you to /dashboard, the dashboard rejects it and sends you back.
   */
  if (await hasValidSession()) {
    redirect("/dashboard");
  }

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-6 bg-page px-4 py-16">
      <div className="bento relative w-full max-w-md overflow-hidden text-fg-inverse">
        <PriceBand />

        <div className="relative flex flex-col gap-6 px-6 pb-6 pt-24 sm:px-8 sm:pb-8">
          <div className="flex flex-col gap-4">
            <span className="flex items-center gap-3">
              <LogoMark className="size-7 shrink-0" />
              <span className="text-lg font-semibold tracking-tight">
                Nordic Power &amp; Weather
              </span>
            </span>

            <p className="font-mono text-[0.6875rem] uppercase tracking-[0.18em] text-fg-inverse-muted">
              {PRICE_AREA.label} · {WEATHER_LOCATION.label}
            </p>
          </div>

          <div className="flex flex-col gap-3">
            <h1 className="text-3xl font-semibold">Login</h1>
            <p className="text-pretty leading-relaxed text-fg-inverse-muted">
              Enter the shared password to open the dashboard. One password for everyone
              with access — there are no accounts.
            </p>
          </div>

          <LoginForm />

          <div className="flex flex-col gap-1 border-t border-line-inverse pt-5 font-mono text-xs text-fg-inverse-muted">
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
              </a>
            </p>
          </div>
        </div>
      </div>

      <Link
        href="/"
        className="inline-flex items-center gap-2 text-sm text-link underline underline-offset-4"
      >
        <FiArrowLeft aria-hidden="true" className="size-4" />
        Back to the overview
      </Link>
    </div>
  );
}

/**
 * The band across the top of the card: the **real** price curve for the example day,
 * faded out downward so it reads as texture rather than a chart.
 *
 * Real data rather than a drawn squiggle, for the same reason the landing page uses it —
 * the shape is free, it is already cached, and a product about not inventing numbers
 * should not decorate its own login screen with invented ones.
 *
 * Decorative, so `aria-hidden`; if the provider is unavailable the card simply renders
 * without it.
 */
async function PriceBand() {
  const prices = await getSettledPrices(PREVIEW_DAY);

  if (prices.status !== "ok") {
    return null;
  }

  const aligned = alignPriceAndWeather(prices.prices, null, "wind");
  const chart = toPreviewChart(aligned, [], -1);

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-x-0 top-0 h-32"
      // Fades the band out downward so it never competes with the wordmark below it.
      style={{
        maskImage: "linear-gradient(to bottom, black 35%, transparent 100%)",
        WebkitMaskImage: "linear-gradient(to bottom, black 35%, transparent 100%)",
      }}
    >
      <svg
        viewBox={`0 0 ${chart.width} ${chart.height}`}
        preserveAspectRatio="none"
        className="size-full"
        role="presentation"
      >
        <defs>
          <linearGradient id="login-band" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--fg-inverse)" stopOpacity="0.16" />
            <stop offset="100%" stopColor="var(--fg-inverse)" stopOpacity="0" />
          </linearGradient>
        </defs>

        <path d={chart.priceArea} fill="url(#login-band)" />
        <path
          d={chart.priceLine}
          fill="none"
          stroke="var(--fg-inverse)"
          strokeWidth="1.5"
          strokeLinecap="round"
          opacity="0.28"
          vectorEffect="non-scaling-stroke"
        />
      </svg>
    </div>
  );
}
