import { HoursTableSkeleton } from "@/features/market-correlation";
import { Skeleton } from "@/shared/ui";

/**
 * Its own loading file, because `loading.tsx` cascades.
 *
 * Without this, navigating to `/dashboard/hours` would show the *dashboard's* skeleton —
 * a KPI row and two charts — and then resolve into a table. The shell is the same; only
 * the region below the header differs, which is exactly what this file changes.
 */
export default function HoursLoading() {
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
            <Skeleton className="h-6 w-56" />
            <Skeleton className="ml-auto h-8 w-8 rounded-pill" />
          </div>
        </header>

        <main className="flex min-w-0 flex-1 flex-col gap-6 px-4 py-6 sm:px-6">
          <HoursTableSkeleton />
        </main>
      </div>
    </div>
  );
}
