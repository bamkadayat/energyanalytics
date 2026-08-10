/**
 * A placeholder block, in the shape of the thing that has not arrived yet.
 *
 * One primitive so every skeleton on the site is the same grey, the same radius and the
 * same pulse. Skeletons had been written where they were used, which is how three bars
 * of unequal width ended up standing in for a chart.
 *
 * **Always `aria-hidden`.** A skeleton is the shape of an answer, not an answer, and a
 * screen reader announcing a dozen empty boxes is worse than silence. The region that
 * holds them owns the single `role="status"` announcement — see `SkeletonRegion`.
 *
 * The pulse is off under `prefers-reduced-motion`: a loading state is exactly the moment
 * someone sensitive to motion is already waiting and looking at the screen.
 */
export function Skeleton({ className = "" }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={`animate-pulse rounded-control bg-surface-subtle motion-reduce:animate-none ${className}`.trim()}
    />
  );
}

/**
 * Wraps a set of `Skeleton`s with the one announcement they share.
 *
 * `aria-busy` marks the region as in-flight; the label is the only thing read out, and it
 * says what is being waited for rather than "loading" in the abstract — the two waits on
 * the dashboard are minutes apart in cost, and knowing which one you are in is the point.
 */
export function SkeletonRegion({
  label,
  className = "",
  children,
}: {
  label: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div role="status" aria-busy="true" className={className}>
      <span className="sr-only">{label}</span>
      {children}
    </div>
  );
}
