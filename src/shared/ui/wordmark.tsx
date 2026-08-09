import Image from "next/image";

/**
 * The mark plus the product name.
 *
 * The logo file has **no alpha channel** — its white background is opaque — so it is set
 * inside a white badge. On the navy hero that reads as a deliberate roundel rather than
 * a white rectangle someone forgot to cut out; on light surfaces the badge is invisible.
 * A transparent PNG or an SVG would remove the need for the badge entirely.
 *
 * `alt=""` because the product name sits right beside it: announcing both would make a
 * screen reader say the name twice.
 */
export function Wordmark({ tone = "default" }: { tone?: "default" | "inverse" }) {
  return (
    <span className="flex items-center gap-2.5">
      <span className="flex size-8 shrink-0 items-center justify-center overflow-hidden rounded-pill bg-surface">
        <Image
          src="/logo.png"
          alt=""
          width={32}
          height={32}
          // The source is 1254px square for a 32px slot; next/image resizes it, but a
          // smaller export (or an SVG) would cut ~940 KB from the origin payload.
          className="size-7 object-contain"
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
