/**
 * Shown while the dashboard segment loads on navigation.
 *
 * The dashboard is a dynamic route behind a session check, so there is a real gap
 * between clicking and the first byte. Without this, navigating from the landing page
 * leaves the previous screen frozen with no indication anything is happening.
 *
 * Deliberately mirrors the loaded layout — header block, controls row, two card
 * outlines — so the page settles into shape rather than reflowing when data arrives.
 */
export default function DashboardLoading() {
  return (
    <div
      className="mx-auto flex w-full max-w-content flex-col gap-8 px-4 py-8 sm:px-6 sm:py-12"
      aria-busy="true"
    >
      {/* One live announcement for the whole screen; the skeleton itself is decorative. */}
      <p role="status" className="sr-only">
        Loading the dashboard.
      </p>

      <div aria-hidden="true" className="flex flex-col gap-3">
        <div className="h-9 w-64 rounded-control bg-surface-subtle" />
        <div className="h-4 w-80 rounded-control bg-surface-subtle" />
      </div>

      <div aria-hidden="true" className="flex flex-wrap gap-8">
        <div className="h-14 w-48 rounded-pill bg-surface-subtle" />
        <div className="h-14 w-40 rounded-pill bg-surface-subtle" />
        <div className="h-14 w-64 rounded-pill bg-surface-subtle" />
      </div>

      <div aria-hidden="true" className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {[0, 1, 2, 3, 4, 5].map((card) => (
          <div key={card} className="h-28 rounded-card border border-line bg-surface" />
        ))}
      </div>

      <div
        aria-hidden="true"
        className="min-h-[var(--chart-min-height)] rounded-card border border-line bg-surface"
      />
    </div>
  );
}
