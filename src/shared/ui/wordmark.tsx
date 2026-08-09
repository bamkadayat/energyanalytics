import Image from "next/image";

/**
 * The mark plus the product name.
 *
 * The logo file still has **no alpha channel** (PNG colour type 2), so its off-white
 * background is opaque and the mark is set inside a white badge. On the navy hero that
 * reads as a deliberate roundel rather than a pale rectangle; on light surfaces the
 * badge is invisible. A transparent PNG or an SVG would remove the need for it.
 *
 * The artwork is fine line work with generous internal padding, so it is scaled slightly
 * beyond the badge and clipped. Rendered to fit, the strokes fall below a pixel at this
 * size and the glyph turns to mush.
 *
 * `alt=""` because the product name sits right beside it: announcing both would make a
 * screen reader say the name twice.
 */
export function Wordmark({ tone = "default" }: { tone?: "default" | "inverse" }) {
  return (
    <span className="flex items-center gap-2.5">
      <span className="flex size-9 shrink-0 items-center justify-center overflow-hidden rounded-pill bg-surface">
        <Image
          src="/logo.png"
          alt=""
          width={36}
          height={36}
          // The source is 1254px square and ~900 KB for a 36px slot; next/image resizes
          // it, but a smaller export or an SVG would cut most of that from the origin.
          className="size-9 scale-125 object-contain"
          priority
        />
      </span>

      <span
        className={`text-sm font-semibold tracking-tight ${
          tone === "inverse" ? "text-fg-inverse" : "text-fg"
        }`}
      >
        Nordic Power &amp; Weather
      </span>
    </span>
  );
}
