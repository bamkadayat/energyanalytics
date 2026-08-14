/**
 * The product mark: two wind gusts above a rising measurement line.
 *
 * Inline so it inherits `currentColor` and needs no request. Three strokes and one dot —
 * anything more disappears at the 36px it is usually drawn at.
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

      {/* The series: a dip keeps it reading as measured, not as a generic up arrow. */}
      <path d="M2.5 19.5h5l4-4.5 3 2 4.5-5.5" />

      {/* Terminal data point, filled so it registers as a mark rather than a stroke end. */}
      <circle cx="21" cy="11.5" r="1.6" fill="currentColor" stroke="none" />
    </svg>
  );
}
