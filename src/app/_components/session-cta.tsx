import Link from "next/link";
import { hasValidSession } from "@/features/auth/api/session";
import { buttonClasses, type ButtonSize } from "@/shared/ui";

/**
 * The call to action, wherever it appears, with its label following the session.
 *
 * A signed-in visitor is sent straight to the dashboard rather than through a login form
 * they do not need — a control should say exactly what it does, and "Log in" is a lie to
 * someone already logged in.
 *
 * Both the navbar and the hero render this, so the two can never disagree about whether
 * you are signed in. Reading the session is request-time work, so each mount belongs
 * inside `<Suspense>`; that keeps the rest of the page in the prerendered shell.
 */
export async function SessionCta({
  size = "lg",
  className,
}: {
  size?: ButtonSize;
  className?: string;
}) {
  const signedIn = await hasValidSession();
  const classes = buttonClasses({ variant: "inverse", size, className });

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

/** Heights match the button's padding plus its line box, so nothing shifts on arrival. */
const PLACEHOLDER_SIZE: Record<ButtonSize, string> = {
  sm: "h-8 w-24",
  md: "h-9 w-28",
  lg: "h-11 w-32",
};

/**
 * Reserves the button's footprint while the session resolves.
 *
 * Deliberately shows no label. Rendering "Log in" and correcting it a moment later would
 * flash the wrong word at the primary control on the page.
 */
export function SessionCtaPlaceholder({
  size = "lg",
  className = "",
}: {
  size?: ButtonSize;
  className?: string;
}) {
  return (
    <div
      aria-hidden="true"
      className={`rounded-pill bg-surface-inverse opacity-40 ${PLACEHOLDER_SIZE[size]} ${className}`.trim()}
    />
  );
}
