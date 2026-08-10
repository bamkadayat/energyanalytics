import Link from "next/link";
import { hasValidSession } from "@/features/auth/api/session";
import { buttonClasses, type ButtonSize } from "@/shared/ui";

/**
 * The call to action, with its label following the session — "Login" is a lie to someone
 * already signed in. The signed-out label is a prop because it varies by position: the
 * navbar wants "Login", the hero is the offer and names the destination.
 *
 * One component everywhere, so no two can disagree about the session. Reading it is
 * request-time, hence the `<Suspense>` at each mount.
 */
export async function SessionCta({
  size = "lg",
  className,
  signedOutLabel = "Login",
}: {
  size?: ButtonSize;
  className?: string;
  signedOutLabel?: string;
}) {
  const signedIn = await hasValidSession();
  const classes = buttonClasses({ variant: "inverse", size, className });

  return signedIn ? (
    <Link href="/dashboard" className={classes}>
      Go to dashboard
    </Link>
  ) : (
    <Link href="/login" className={classes}>
      {signedOutLabel}
    </Link>
  );
}

/** Heights match the button's padding plus its line box, so nothing shifts on arrival. */
const PLACEHOLDER_SIZE: Record<ButtonSize, string> = {
  sm: "h-8 w-24",
  md: "h-9 w-28",
  lg: "h-11 w-32",
};

/** Reserves the footprint, with no label: guessing would flash the wrong word. */
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
