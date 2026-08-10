import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { FiArrowLeft } from "react-icons/fi";
import { LoginForm } from "@/features/auth";
import { hasValidSession } from "@/features/auth/api/session";
import { PRICE_AREA, WEATHER_LOCATION } from "@/shared/config";
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
      <div className="bento w-full max-w-md overflow-hidden text-fg-inverse">
        <div className="flex flex-col gap-6 p-6 sm:p-8">
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
