import Link from "next/link";
import { hasValidSession } from "@/features/auth/api/session";
import { buttonClasses, type ButtonSize } from "@/shared/ui";

/**
 * The call to action, with its label following the session — "Log in" is a lie to someone
 * already signed in.
 *
 * **That rule binds in both directions.** The signed-out label in the hero and closing
 * band was once "Open the dashboard", on the argument that the button is the offer and
 * login is merely the gate on the way to it. That was the same lie reversed: it promised a
 * dashboard and delivered a password field.
 *
 * Two labels, no prop. The label used to vary by placement; it does not need to. What the
 * button does is identical in all three positions, and the surrounding copy already says
 * what is behind the gate — a control that reads differently in each spot only invites the
 * three to drift apart again.
 *
 * One component everywhere, so no two can disagree about the session. Reading it is
 * request-time, hence the `<Suspense>` at each mount.
 *
 * `appearance` varies the *presentation only* — never the label or the destination. The
 * navbar is `text`: a pill up there competed with the hero's, and one page should have one
 * primary action. The hero and closing band stay `pill`.
 */
export type SessionCtaAppearance = "pill" | "text";

/**
 * The navbar link, on the navy band.
 *
 * No underline at rest, which `ui-rules.md` otherwise requires of links. The rule exists
 * because `--link` is near-indistinguishable from body text by colour — but this sits
 * alone in the top-right of a `<header>`, opposite the wordmark, where position is the
 * affordance and there is no body text to be confused with. The focus ring is overridden
 * because the global `--focus` is invisible on this surface.
 *
 * Sized and weighted to answer the wordmark across the bar (`text-base font-semibold
 * sm:text-lg`, the wordmark's own scale). Dropping the pill cost it presence, and a nav
 * link that recedes into the band is a worse outcome than the pill it replaced.
 */
const TEXT_APPEARANCE =
  "inline-flex items-center text-base font-semibold tracking-tight text-fg-inverse underline-offset-4 hover:underline focus-visible:outline-fg-inverse sm:text-lg";

export async function SessionCta({
  size = "lg",
  className = "",
  appearance = "pill",
}: {
  size?: ButtonSize;
  className?: string;
  appearance?: SessionCtaAppearance;
}) {
  const signedIn = await hasValidSession();
  const classes =
    appearance === "text"
      ? `${TEXT_APPEARANCE} ${className}`.trim()
      : buttonClasses({ variant: "inverse", size, className });

  return signedIn ? (
    <Link href="/dashboard" className={classes}>
      Go to dashboard
    </Link>
  ) : (
    <Link href="/login" className={classes}>
      Log in
    </Link>
  );
}

/**
 * Heights match the button's padding plus its line box, so nothing shifts on arrival.
 *
 * The *width* can only ever be an approximation: "Log in" and "Go to dashboard" differ in
 * length, and which one arrives is the thing being waited for. The `lg` callers pass a
 * `sm:w-48` that fits the longer of the two, so the pill holds one width either way.
 */
const PLACEHOLDER_SIZE: Record<ButtonSize, string> = {
  sm: "h-8 w-24",
  md: "h-9 w-28",
  lg: "h-11 w-32",
};

/**
 * Reserves the footprint, with no label: guessing would flash the wrong word.
 *
 * The `text` appearance reserves a line box rather than a pill — a pill-shaped placeholder
 * resolving into bare text is a worse flash than no placeholder at all.
 */
export function SessionCtaPlaceholder({
  size = "lg",
  className = "",
  appearance = "pill",
}: {
  size?: ButtonSize;
  className?: string;
  appearance?: SessionCtaAppearance;
}) {
  const shape =
    appearance === "text"
      ? "h-6 w-16 rounded-control sm:h-7"
      : `rounded-pill ${PLACEHOLDER_SIZE[size]}`;

  return (
    <div
      aria-hidden="true"
      className={`bg-surface-inverse opacity-40 ${shape} ${className}`.trim()}
    />
  );
}
