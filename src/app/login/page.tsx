import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { FiArrowLeft } from "react-icons/fi";
import { LoginForm } from "@/features/auth";
import { hasValidSession } from "@/features/auth/api/session";
import { PRICE_AREA, WEATHER_LOCATION } from "@/shared/config";
import { getDemoPasswordHint } from "@/shared/config/server";
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
 * anything, and a control that cannot work is worse than a missing one.
 *
 * A paragraph used to explain that absence in words. It is gone: the form is a labelled
 * field and a button, and a sentence describing a form that simple is read past rather
 * than read. What it also carried — that there is one shared password and no account —
 * the demo note below now says where it actually matters.
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
    /*
      White ground, navy ink, no filled panel.

      This was a dark `bento` card on a tinted page — two surfaces stacked to frame a form
      with a single field. The page carries no fill at all now, and structure comes from a
      hairline and the field's own edge. The only saturated thing left is the submit
      button, which is the one element that should pull the eye.
    */
    <div className="flex flex-1 flex-col items-center justify-center gap-6 bg-surface px-4 py-16">
      <div className="w-full max-w-md rounded-card border border-line text-fg">
        <div className="flex flex-col gap-6 p-6 sm:p-8">
          <div className="flex flex-col gap-4">
            <span className="flex items-center gap-3">
              <LogoMark className="size-7 shrink-0" />
              <span className="text-lg font-semibold tracking-tight">
                Nordic Power &amp; Weather
              </span>
            </span>

            <p className="font-mono text-[0.6875rem] uppercase tracking-[0.18em] text-fg-muted">
              {PRICE_AREA.label} · {WEATHER_LOCATION.label}
            </p>
          </div>

          <h1 className="text-3xl font-semibold">Log in</h1>

          <LoginForm />

          <DemoPasswordNote />

          <div className="flex flex-col gap-1 border-t border-line pt-5 font-mono text-xs text-fg-muted">
            <p>
              Prices{" "}
              <a
                href="https://www.hvakosterstrommen.no"
                className="text-link underline underline-offset-4"
              >
                hvakosterstrommen.no
              </a>
            </p>
            <p>
              Weather{" "}
              <a
                href="https://open-meteo.com"
                className="text-link underline underline-offset-4"
              >
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
 * Prints the demo password, when a deployment has opted in by setting
 * `DEMO_PASSWORD_HINT`.
 *
 * Without this, a reviewer opening the deployed link reaches a password field with no
 * way to get past it and no indication that one was ever meant to exist — the demo is
 * unreachable by exactly the audience it is for.
 *
 * It renders nothing at all when the variable is unset, so the default deployment
 * discloses nothing. See `shared/config/server.ts` for why it is a separate variable
 * from the real password.
 *
 * **No tint.** This first used the `info` family, which put a pale blue block on a page
 * that has no other colour. The restraint pass had already removed exactly that from the
 * dashboard's standing note: colour here encodes data, and a note about a password encodes
 * nothing. It is separated by a rule, like the sources below it.
 */
function DemoPasswordNote() {
  const hint = getDemoPasswordHint();

  if (hint === null) {
    return null;
  }

  return (
    <div className="flex flex-col gap-2 border-t border-line pt-5">
      <p className="text-sm text-fg-secondary">
        Demo password{" "}
        {/*
          Selectable and boxed, because a reviewer will copy this rather than retype it,
          and a bare word in a sentence gives them nothing to aim at. `--line-strong` is
          the same edge the password field carries.
        */}
        <code className="select-all rounded-control border border-line-strong px-2 py-0.5 font-mono text-fg">
          {hint}
        </code>
      </p>

      {/*
        Says why the gate exists, so a reviewer does not read a published password as an
        oversight. It is here to demonstrate the sign-in flow, and nothing behind it is
        private — every figure comes from a public API.
      */}
      <p className="text-xs leading-relaxed text-fg-muted">
        This is a portfolio demo. The gate exists to show the sign-in flow; the data
        behind it is public either way.
      </p>
    </div>
  );
}
