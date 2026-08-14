import { HoursTableSkeleton } from "@/features/market-correlation";
import { Skeleton } from "@/shared/ui";
import {
  DataNoteSkeleton,
  HeaderSkeleton,
  RailSkeleton,
} from "../_components/shell-skeleton";

/**
 * Its own, because `loading.tsx` cascades: without it, `/dashboard/hours` would show a
 * KPI row and two charts resolving into a table.
 */
export default function HoursLoading() {
  return (
    <div className="flex min-h-screen bg-page">
      <RailSkeleton active="hours" />

      <div className="flex min-w-0 flex-1 flex-col">
        <HeaderSkeleton>
          {/*
            The `h1` — "All hours", plus "90 days" from `sm`. `sm:w-56` reserved room for
            the longer `· NO1 · Europe/Oslo` this header used to carry; leaving it there
            would make the header visibly narrow as the skeleton resolved.
          */}
          <Skeleton className="h-6 w-24 shrink-0 sm:w-36" />

          {/*
            `DataNote`, which is a labelled pill from `sm` — the previous version reserved
            a 32px circle here, so the header resolved into something visibly wider.
          */}
          <div className="ml-auto shrink-0">
            <DataNoteSkeleton />
          </div>
        </HeaderSkeleton>

        {/* `gap-2` and a back-link row, matching the real `main` above the heading. */}
        <main className="flex min-w-0 flex-1 flex-col gap-2 px-4 py-6 sm:px-6">
          <Skeleton className="h-5 w-24" />

          <HoursTableSkeleton />
        </main>
      </div>
    </div>
  );
}
