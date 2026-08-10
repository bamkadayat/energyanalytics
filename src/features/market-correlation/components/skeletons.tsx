import { Skeleton, SkeletonRegion } from "@/shared/ui";

/**
 * Loading shapes for the three regions that stream.
 *
 * Each one mirrors the layout it stands in for — same grid, same card count, same
 * proportions — so the page settles into shape instead of reflowing when the data lands.
 * A skeleton that does not predict its own replacement is just a grey rectangle, and it
 * costs a layout shift on arrival.
 *
 * They live beside the components they shadow rather than in `shared/ui`, because their
 * whole job is to know this layout. `shared/ui` owns the block and the region wrapper;
 * the arrangement is domain knowledge.
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

/**
 * The day view: the KPI row, then the chart beside the observations column.
 *
 * The proportions are the real ones — `1.15fr / 1.85fr` for the KPIs, `2fr / 1fr` below —
 * so the two columns do not jump sideways when the numbers arrive.
 */
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

      <div className="grid gap-6 xl:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <Card>
          <CardHeader />
          <Skeleton className="min-h-[var(--chart-min-height)] flex-1" />
        </Card>

        {/* Same three arrangements as the real column — see `correlation-view.tsx`. */}
        <div className="grid gap-4 md:grid-cols-2 md:items-start xl:grid-cols-1">
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

/**
 * The range section: heading, summary line, the preset row, then the two range cards.
 *
 * This is the slower of the two waits — one price request per day — so it is the skeleton
 * most likely to be seen, and the one that most needs to look like a page rather than a
 * placeholder.
 */
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
          <Skeleton className="min-h-[var(--chart-heatmap-height)] flex-1" />
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
 * The hours table: the controls, the header row, and rows to the height of the real
 * scroll window.
 *
 * Ninety days is ninety cached price requests, so on a cold cache this is the screen a
 * first visitor actually sits in front of. The row count is fixed rather than computed
 * from `--table-height`: it only has to fill the box, and CSS clips the overflow.
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
