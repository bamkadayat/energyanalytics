import { DayViewSkeleton, RangeViewsSkeleton } from "@/features/market-correlation";
import { Skeleton } from "@/shared/ui";

/**
 * Shown while the dashboard segment loads — a dynamic route behind a session check, so
 * the gap is real.
 *
 * It mirrors the *shell*: a skeleton that resolves into a different arrangement is worse
 * than none. The rail and header are drawn flat rather than imported, since the real ones
 * read `searchParams` and a loading file does not receive them.
 */
export default function DashboardLoading() {
  return (
    <div className="flex min-h-screen bg-page">
      <aside
        aria-hidden="true"
        className="sticky top-0 hidden h-screen w-60 shrink-0 flex-col bg-surface-rail lg:flex"
      >
        <div className="border-b border-line-inverse px-4 py-4">
          <div className="h-9 w-40 rounded-control bg-surface-rail-active" />
        </div>

        <div className="flex flex-col gap-7 px-3 py-5">
          {[3, 3].map((rows, group) => (
            <div key={group} className="flex flex-col gap-2">
              <div className="h-3 w-24 rounded-control bg-surface-rail-active" />
              {Array.from({ length: rows }, (_, row) => (
                <div key={row} className="h-9 rounded-control bg-surface-rail-active" />
              ))}
            </div>
          ))}
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="border-b border-line bg-surface">
          <div className="flex items-center gap-3 px-4 py-3 sm:px-6">
            <Skeleton className="size-9 lg:hidden" />
            <Skeleton className="h-9 w-44 rounded-pill" />
            <Skeleton className="ml-auto h-8 w-40" />
          </div>
        </header>

        <main className="flex min-w-0 flex-1 flex-col gap-6 px-4 py-6 sm:px-6">
          <DayViewSkeleton />
          <RangeViewsSkeleton />
        </main>
      </div>
    </div>
  );
}
