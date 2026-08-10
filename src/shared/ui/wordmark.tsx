import { LogoMark } from "./logo-mark";

/**
 * The mark plus the product name. Both inherit colour from the wrapper, so one `tone`
 * switch replaces an asset per background. The mark is `aria-hidden` — the name is beside
 * it, and announcing both says it twice.
 */
export function Wordmark({
  tone = "default",
  short = false,
}: {
  tone?: "default" | "inverse";
  /** Drops "Nordic" from the visible name; in the 240px rail the full one wraps. */
  short?: boolean;
}) {
  return (
    <span
      className={`flex items-center gap-3 ${
        tone === "inverse" ? "text-fg-inverse" : "text-fg"
      }`}
    >
      <LogoMark className="size-9 shrink-0" />

      <span className="text-base font-semibold tracking-tight sm:text-lg">
        {short ? (
          <>
            {/* Short to the eye, whole to a screen reader — one product, one name. */}
            <span aria-hidden="true">Power &amp; Weather</span>
            <span className="sr-only">Nordic Power &amp; Weather</span>
          </>
        ) : (
          "Nordic Power & Weather"
        )}
      </span>
    </span>
  );
}
