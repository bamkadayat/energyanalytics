import { DayViewSkeleton, RangeViewsSkeleton } from "@/features/market-correlation";
import { Skeleton } from "@/shared/ui";
import { DateChipPlaceholder } from "./_components/header-controls";
import {
  DataNoteSkeleton,
  HeaderSkeleton,
  RailSkeleton,
} from "./_components/shell-skeleton";

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
      <RailSkeleton />

      <div className="flex min-w-0 flex-1 flex-col">
        <HeaderSkeleton>
          {/* `DaySwitch` — a segmented pill of two links at `py-1.5 text-sm`, so 36px. */}
          <Skeleton className="h-9 w-44 shrink-0 rounded-pill" />

          {/*
            `ScopeLine`, which the previous version omitted entirely — so the header
            resolved with an extra element in the middle. It is `hidden sm:flex`, and so
            is this.
          */}
          <Skeleton className="hidden h-4 w-44 sm:block" />

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
