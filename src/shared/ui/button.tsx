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

export type ButtonVariant = "primary" | "secondary" | "outline" | "inverse";
export type ButtonSize = "sm" | "md" | "lg";

/**
 * `rounded-pill` on every button, always.
 *
 * Inputs keep `rounded-control`: a pill-shaped text field reads as a tag or a search
 * chip, and long values sit awkwardly against the curve. The distinction is *controls
 * you press* versus *controls you type into*, not a stylistic preference — see
 * `ui-rules.md`.
 */
const BASE =
  "inline-flex items-center justify-center rounded-pill font-medium transition-colors disabled:cursor-not-allowed disabled:bg-disabled disabled:text-on-disabled";

const VARIANTS: Record<ButtonVariant, string> = {
  primary:
    "bg-action-primary text-on-action-primary hover:bg-action-primary-hover active:bg-action-primary-active",
  secondary:
    "bg-action-secondary text-on-action-secondary hover:bg-action-secondary-hover",
  outline: "border border-line-strong text-fg-secondary hover:bg-surface-subtle",
  /** For use on `--surface-inverse`: a white pill against the navy field. */
  inverse: "bg-surface text-fg hover:bg-surface-subtle",
};

const SIZES: Record<ButtonSize, string> = {
  sm: "px-3 py-1.5 text-sm",
  md: "px-4 py-2 text-sm",
  lg: "px-7 py-3 text-base",
};

export function buttonClasses({
  variant = "primary",
  size = "md",
  className = "",
}: {
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
} = {}): string {
  return `${BASE} ${VARIANTS[variant]} ${SIZES[size]} ${className}`.trim();
}

export type ButtonProps = React.ComponentPropsWithoutRef<"button"> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
};

export function Button({
  variant,
  size,
  className,
  type = "button",
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={buttonClasses({ variant, size, className })}
      {...props}
    />
  );
}
