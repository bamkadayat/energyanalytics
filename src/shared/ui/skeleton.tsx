/**
 * One primitive, so every skeleton shares a grey, a radius and a pulse. Always
 * `aria-hidden` — `SkeletonRegion` owns the single announcement.
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
 * Wraps a set of `Skeleton`s with the one announcement they share. The label names what
 * is being waited for: the dashboard's two waits differ by an order of magnitude.
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
