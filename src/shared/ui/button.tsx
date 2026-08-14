/**
 * The single source of button styling.
 *
 * Buttons had drifted — some `rounded-pill`, some `rounded-control` — because each was
 * styled where it was used. Everything goes through here now, so the shape cannot vary
 * by author.
 *
 * `buttonClasses` returns a string rather than the component wrapping everything,
 * because these styles have to apply to three different elements: `<button>`, Next's
 * `<Link>`, and a plain `<a>`. A component per element would be the same rule copied
 * three times, which is the problem this file exists to solve.
 */

export type ButtonVariant =
  | "primary"
  | "primary-soft"
  | "secondary"
  | "outline"
  | "inverse"
  | "ghost-inverse";
export type ButtonSize = "sm" | "md" | "lg";

/**
 * `pill` is the default and stays the rule — buttons had drifted between radii because
 * each was styled at its call site, and that is what this module exists to stop.
 *
 * `tight` (4px, `--radius-tight`) is a named, deliberate exception rather than a free
 * `className` override, so the set of radii a button can have stays enumerable and
 * greppable. A raw `rounded-[4px]` in a call site would collide with the one in `BASE`
 * and resolve by CSS source order, not by which class was written last — silently
 * fragile in exactly the way an escape hatch should not be.
 */
export type ButtonRadius = "pill" | "tight";

const RADII: Record<ButtonRadius, string> = {
  pill: "rounded-pill",
  tight: "rounded-tight",
};

/**
 * Everything a button carries regardless of variant, size or radius. The radius itself
 * comes from `RADII` — it is the one axis with a documented exception.
 *
 * Inputs keep `rounded-control`: a pill-shaped text field reads as a tag or a search
 * chip, and long values sit awkwardly against the curve. The distinction is *controls
 * you press* versus *controls you type into*, not a stylistic preference — see
 * `ui-rules.md`.
 */
const BASE =
  "btn-ring inline-flex items-center justify-center font-medium transition-colors disabled:cursor-not-allowed disabled:bg-disabled disabled:text-on-disabled";

/*
 * Each variant declares `--btn-ring-color`, which `.btn-ring` in globals.css uses for
 * both the hover ring and the focus ring. The colour has to be chosen per variant: a
 * ring is only visible against the surface the button sits on, and those differ.
 */
const VARIANTS: Record<ButtonVariant, string> = {
  primary:
    "bg-action-primary text-on-action-primary hover:bg-action-primary-hover active:bg-action-primary-active [--btn-ring-color:var(--action-primary)]",
  /*
   * `primary` with its rest and hover fills swapped: it sits at `--action-primary-hover`
   * (navy-800) and *darkens* to `--action-primary` (navy-900) under the cursor.
   *
   * That makes the whole interaction one direction — 800 → 900 → 950 at rest, hover and
   * press — where `primary` lightens on hover and then darkens again on press. Contrast
   * is not the reason to prefer either: white clears 15.68:1 on navy-800 and 18.67:1 on
   * navy-900, so both are far past AA.
   *
   * A separate variant rather than a `className` override at the call site, because two
   * `bg-*` classes in one string resolve by CSS source order, not by which was written
   * last.
   */
  "primary-soft":
    "bg-action-primary-hover text-on-action-primary hover:bg-action-primary active:bg-action-primary-active [--btn-ring-color:var(--action-primary)]",
  secondary:
    "bg-action-secondary text-on-action-secondary hover:bg-action-secondary-hover [--btn-ring-color:var(--action-primary)]",
  outline:
    "border border-line-strong text-fg-secondary hover:bg-surface-subtle [--btn-ring-color:var(--line-strong)]",
  /*
   * On `--surface-inverse`. Hover inverts the fill so the white ring has something to
   * read against — a white ring around a white pill on navy would be invisible.
   */
  inverse:
    "bg-surface text-fg hover:bg-surface-inverse hover:text-fg-inverse [--btn-ring-color:var(--fg-inverse)]",
  /*
   * The secondary action on `--surface-inverse`, beside an `inverse` button. Two filled
   * pills side by side weigh the same, so neither reads as the primary one; this carries
   * an outline instead. `--line-inverse-strong` rather than `--line-inverse` because a
   * control's boundary has to clear 3:1, which the hairline token does not.
   *
   * An inset ring rather than a `border`, unlike the `outline` variant: this one sits
   * *beside* a filled pill, and a border would make it 2px taller than its neighbour.
   * A ring paints inside the box and costs no layout.
   */
  "ghost-inverse":
    "inset-ring inset-ring-line-inverse-strong text-fg-inverse hover:inset-ring-fg-inverse [--btn-ring-color:var(--fg-inverse)]",
};

/*
 * Horizontal padding grows faster than vertical across the sizes. A pill reads as
 * confident when it is wider than it is tall; matching the two makes it drift toward a
 * lozenge and look heavier than its role.
 */
const SIZES: Record<ButtonSize, string> = {
  sm: "px-3 py-1.5 text-sm",
  md: "px-4 py-2 text-sm",
  lg: "px-7 py-2.5 text-base",
};

export function buttonClasses({
  variant = "primary",
  size = "md",
  radius = "pill",
  className = "",
}: {
  variant?: ButtonVariant;
  size?: ButtonSize;
  radius?: ButtonRadius;
  className?: string;
} = {}): string {
  return `${BASE} ${RADII[radius]} ${VARIANTS[variant]} ${SIZES[size]} ${className}`.trim();
}

export type ButtonProps = React.ComponentPropsWithoutRef<"button"> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  radius?: ButtonRadius;
};

export function Button({
  variant,
  size,
  radius,
  className,
  type = "button",
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={buttonClasses({ variant, size, radius, className })}
      {...props}
    />
  );
}
