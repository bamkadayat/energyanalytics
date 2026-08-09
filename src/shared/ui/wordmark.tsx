import { LogoMark } from "./logo-mark";

/**
 * The mark plus the product name.
 *
 * Both take their colour from the wrapper, so there is a single `tone` switch rather
 * than a separate asset per background. The mark is inline SVG using `currentColor`,
 * which is what removed the white badge the old PNG needed.
 *
 * The mark is `aria-hidden`: the product name sits right beside it, and announcing both
 * would make a screen reader say the name twice.
 */
export function Wordmark({ tone = "default" }: { tone?: "default" | "inverse" }) {
  return (
    <span
      className={`flex items-center gap-2.5 ${
        tone === "inverse" ? "text-fg-inverse" : "text-fg"
      }`}
    >
      <LogoMark className="size-7 shrink-0" />

      <span className="text-sm font-semibold tracking-tight">
        Nordic Power &amp; Weather
      </span>
    </span>
  );
}
