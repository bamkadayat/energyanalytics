import Link from "next/link";
import { hasValidSession } from "@/features/auth/api/session";
import { buttonClasses } from "@/shared/ui";

const PILL = buttonClasses({ variant: "inverse", size: "lg" });

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
      className="h-[3.25rem] w-40 rounded-pill bg-surface-inverse opacity-40"
    />
  );
}
