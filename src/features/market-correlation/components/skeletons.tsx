import { Skeleton, SkeletonRegion } from "@/shared/ui";

/**
 * Loading shapes for the three streaming regions, each mirroring the layout it replaces
 * so nothing reflows. Here rather than `shared/ui`, which owns only the block itself.
 */

/** Header row of a card: a title, and the control that sits opposite it. */
function CardHeader() {
  return (
    <div className="flex items-center justify-between gap-3">
      <Skeleton className="h-5 w-40" />
      <Skeleton className="h-8 w-36 rounded-pill" />
    </div>
  );
}

function Card({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-4 rounded-card border border-line bg-surface p-4">
      {children}
    </div>
  );
}

/** The day view. Real proportions and breakpoints, so nothing jumps on arrival. */
export function DayViewSkeleton() {
  return (
    <SkeletonRegion
      label="Loading today's prices and weather."
      className="flex min-w-0 flex-col gap-6"
    >
      <div className="grid gap-3 xl:grid-cols-[minmax(0,1.15fr)_minmax(0,1.85fr)]">
        {/* The price-now card: label, a large figure, a line, then the hour strip. */}
        <Card>
          <Skeleton className="h-3 w-28" />
          <Skeleton className="h-10 w-48" />
          <Skeleton className="h-4 w-56" />
          <Skeleton className="h-14 w-full" />
        </Card>

        <div className="grid gap-3 sm:grid-cols-2">
          {[0, 1, 2, 3].map((card) => (
            <div
              key={card}
              className="flex flex-col gap-2 rounded-card border border-line bg-surface p-3"
            >
              <Skeleton className="h-3 w-24" />
              <Skeleton className="h-6 w-20" />
              <Skeleton className="h-3 w-12" />
            </div>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-6">
        <Card>
          <CardHeader />
          <Skeleton className="min-h-[var(--chart-min-height)] flex-1" />
        </Card>

        {/* Same three arrangements as the real column — see `correlation-view.tsx`. */}
        <div className="grid gap-4 xl:grid-cols-2 xl:items-start">
          <Card>
            <Skeleton className="h-5 w-32" />
            {[0, 1, 2, 3].map((row) => (
              <div key={row} className="flex items-start gap-3">
                <Skeleton className="h-6 w-14 shrink-0" />
                <Skeleton className="h-10 flex-1" />
              </div>
            ))}
          </Card>

          <Card>
            <Skeleton className="h-5 w-44" />
            <Skeleton className="h-8 w-32" />
            <Skeleton className="h-3 w-28" />
            <Skeleton className="h-1.5 w-full rounded-pill" />
          </Card>
        </div>
      </div>
    </SkeletonRegion>
  );
}

/** The range section. The slower wait — one price request per day — so the most seen. */
export function RangeViewsSkeleton() {
  return (
    <SkeletonRegion
      label="Loading the range."
      className="flex min-w-0 flex-col gap-4"
    >
      <div className="flex flex-col gap-3">
        <div className="flex flex-col gap-2">
          <Skeleton className="h-6 w-56" />
          <Skeleton className="h-4 w-full max-w-2xl" />
          <Skeleton className="h-4 w-2/3 max-w-xl" />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {[0, 1, 2, 3].map((preset) => (
            <Skeleton key={preset} className="h-8 w-24 rounded-pill" />
          ))}
        </div>
      </div>

      <div className="grid gap-6 2xl:grid-cols-2">
        <Card>
          <CardHeader />
          <Skeleton className="min-h-[var(--chart-min-height)] flex-1" />
        </Card>

        <Card>
          <CardHeader />
          <Skeleton className="min-h-[var(--chart-min-height)] flex-1" />
        </Card>
      </div>
    </SkeletonRegion>
  );
}

/**
 * The hours table. Ninety cached price requests on a cold cache, so this is the screen a
 * first visitor sits in front of. Fixed row count — it only has to fill the box.
 */
export function HoursTableSkeleton() {
  return (
    <SkeletonRegion
      label="Loading ninety days of hourly prices and weather."
      className="flex min-w-0 flex-col gap-4"
    >
      <div className="flex flex-col gap-1">
        <Skeleton className="h-6 w-72" />
        <Skeleton className="h-4 w-full max-w-3xl" />
      </div>

      <div className="flex flex-col gap-4 rounded-card border border-line bg-surface p-4">
        <div className="flex flex-wrap items-end gap-3">
          <Skeleton className="h-10 w-full max-w-xs" />
          <Skeleton className="h-6 w-48" />
          <Skeleton className="ml-auto h-8 w-32" />
        </div>

        <div className="flex h-[var(--table-height)] flex-col gap-px overflow-hidden rounded-control border border-line">
          <Skeleton className="h-10 shrink-0 rounded-none" />
          {Array.from({ length: 16 }, (_, row) => (
            <Skeleton key={row} className="h-10 shrink-0 rounded-none opacity-70" />
          ))}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <Skeleton className="h-4 w-64" />
          <Skeleton className="h-8 w-52 rounded-pill" />
        </div>
      </div>
    </SkeletonRegion>
  );
}
