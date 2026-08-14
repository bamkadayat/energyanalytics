import { DayViewSkeleton, RangeViewsSkeleton } from "@/features/market-correlation";
import { Skeleton } from "@/shared/ui";
import { DateChipPlaceholder } from "./_components/header-controls";
import {
  DataNoteSkeleton,
  HeaderSkeleton,
  RailSkeleton,
} from "./_components/shell-skeleton";

/**
 * Mirrors the shell — a skeleton resolving into a different arrangement is worse than
 * none. Drawn flat because the real rail and header read `searchParams`, which a
 * `loading.tsx` never receives.
 */
export default function DashboardLoading() {
  return (
    <div className="flex min-h-screen bg-page">
      <RailSkeleton />

      <div className="flex min-w-0 flex-1 flex-col">
        <HeaderSkeleton>
          {/* `DaySwitch` — a segmented pill of two links at `py-1.5 text-sm`, so 36px. */}
          <Skeleton className="h-9 w-44 shrink-0 rounded-pill" />

          {/*
            The same cluster the header builds: the note and the date, not one block
            standing in for both. `DateChipPlaceholder` is the real placeholder the page
            already uses for this chip, so its footprint cannot be wrong.
          */}
          <div className="ml-auto flex min-w-0 items-center gap-1 sm:gap-3">
            <DataNoteSkeleton />
            <DateChipPlaceholder />
          </div>
        </HeaderSkeleton>

        <main className="flex min-w-0 flex-1 flex-col gap-6 px-4 py-6 sm:px-6">
          <DayViewSkeleton />
          <RangeViewsSkeleton />
        </main>
      </div>
    </div>
  );
}
