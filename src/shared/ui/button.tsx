/**
 * The single source of button styling.
 *
 * `buttonClasses` returns a string rather than the component wrapping everything, because
 * these styles apply to three elements: `<button>`, Next's `<Link>`, and a plain `<a>`.
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
 * `pill` by default; `tight` (6px) is a named exception so the set of radii stays
 * enumerable. A `className` radius would collide with `BASE` and resolve by CSS source
 * order rather than by which was written last.
 */
export type ButtonRadius = "pill" | "tight";

const RADII: Record<ButtonRadius, string> = {
  pill: "rounded-pill",
  tight: "rounded-tight",
};

const BASE =
  "btn-ring inline-flex items-center justify-center font-medium transition-colors disabled:cursor-not-allowed disabled:bg-disabled disabled:text-on-disabled";

/*
 * Each variant sets `--btn-ring-color` for `.btn-ring` in globals.css. A ring is only
 * visible against the surface the button sits on, so the colour is per variant.
 */
const VARIANTS: Record<ButtonVariant, string> = {
  primary:
    "bg-action-primary text-on-action-primary hover:bg-action-primary-hover active:bg-action-primary-active [--btn-ring-color:var(--action-primary)]",
  /* `primary` with rest and hover swapped, so the fill only ever darkens: 800 → 900 → 950. */
  "primary-soft":
    "bg-action-primary-hover text-on-action-primary hover:bg-action-primary active:bg-action-primary-active [--btn-ring-color:var(--action-primary)]",
  secondary:
    "bg-action-secondary text-on-action-secondary hover:bg-action-secondary-hover [--btn-ring-color:var(--action-primary)]",
  outline:
    "border border-line-strong text-fg-secondary hover:bg-surface-subtle [--btn-ring-color:var(--line-strong)]",
  /* On `--surface-inverse`. Hover inverts the fill so the white ring has something to read against. */
  inverse:
    "bg-surface text-fg hover:bg-surface-inverse hover:text-fg-inverse [--btn-ring-color:var(--fg-inverse)]",
  /*
   * Secondary action beside an `inverse` button. An inset ring, not a border — a border
   * would make it 2px taller than the filled pill next to it.
   */
  "ghost-inverse":
    "inset-ring inset-ring-line-inverse-strong text-fg-inverse hover:inset-ring-fg-inverse [--btn-ring-color:var(--fg-inverse)]",
};

/* Horizontal padding grows faster than vertical: a pill that is as tall as it is wide reads heavy. */
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
