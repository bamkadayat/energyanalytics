/**
 * The product mark: two wind gusts above a rising measurement line.
 *
 * The idea is the product in one glyph — moving air, read as a series. The upper two
 * strokes are the standard meteorological gust curl; the lower one is a plotted line
 * ending in a data point, which is literally what the dashboard draws.
 *
 * Drawn inline rather than loaded from a file so it needs no request, scales without
 * blurring, and — the reason that matters most here — inherits `currentColor`. The
 * previous PNG had no alpha channel, so it needed a white badge to sit on the navy hero;
 * this simply takes the colour of whatever it is placed in.
 *
 * Kept to three strokes and one dot. Anything more disappears at 36px, which is the size
 * it is used at almost everywhere.
 */
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
      focusable="false"
    >
      {/* Upper gust, curling up and back — air leaving the frame. */}
      <path d="M2.5 7.5h8a2.5 2.5 0 1 0-2.5-2.5" />

      {/* Lower gust, curling down, so the two do not read as a repeated shape. */}
      <path d="M2.5 12.5h11a2.5 2.5 0 1 1-2.5 2.5" />

      {/* The series: flat, then climbing, with a dip so it reads as measured rather
          than as a generic upward arrow. */}
      <path d="M2.5 19.5h5l4-4.5 3 2 4.5-5.5" />

      {/* Terminal data point, filled so it registers as a mark rather than a stroke end. */}
      <circle cx="21" cy="11.5" r="1.6" fill="currentColor" stroke="none" />
    </svg>
  );
}
