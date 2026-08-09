import Link from "next/link";
import { hasValidSession } from "@/features/auth/api/session";
import { buttonClasses } from "@/shared/ui";

/*
 * A minimum width from `sm` upward, never a fixed one. The button still grows with its
 * label — "Go to dashboard" is longer than "Log in" and must not be clipped — but it
 * stops looking undersized against a 4.5rem headline.
 *
 * Left at its content width below `sm`: in a narrow column a 12rem minimum would nearly
 * span the viewport and read as a full-width bar rather than a button.
 */
const PILL = buttonClasses({
  variant: "inverse",
  size: "lg",
  className: "sm:min-w-48",
});

/**
 * The page's single call to action, which changes with the session.
 *
 * A signed-in visitor is sent straight to the dashboard rather than through a login form
 * they do not need — a control should say exactly what it does, and "Log in" is a lie to
 * someone already logged in.
 *
 * Reading the session is request-time work, so this is mounted inside `<Suspense>` on
 * the landing page. That keeps the rest of the hero — headline, subtitle, visual —
 * static HTML, with only this button resolving per request.
 */
export async function HeroCta() {
  const signedIn = await hasValidSession();

  return signedIn ? (
    <Link href="/dashboard" className={PILL}>
      Go to dashboard
    </Link>
  ) : (
    <Link href="/login" className={PILL}>
      Log in
    </Link>
  );
}

/**
 * Reserves the button's exact footprint while the session resolves.
 *
 * Deliberately not a "Log in" button that later swaps: showing the wrong label first and
 * correcting it is worse than showing nothing for a moment, especially for the one
 * control on the page.
 */
export function HeroCtaPlaceholder() {
  return (
    <div
      aria-hidden="true"
      // Mirrors the button exactly: h-12 is py-3 plus a 1.5rem line box, and the width
      // tracks the same sm: step, so nothing shifts when the real button arrives.
      className="h-12 w-32 rounded-pill bg-surface-inverse opacity-40 sm:w-48"
    />
  );
}
