import { HoursTableSkeleton } from "@/features/market-correlation";
import { Skeleton } from "@/shared/ui";
import {
  DataNoteSkeleton,
  HeaderSkeleton,
  RailSkeleton,
} from "../_components/shell-skeleton";

/** Its own file: `loading.tsx` cascades, so without it this route shows the dashboard's. */
export default function HoursLoading() {
  return (
    <div className="flex min-h-screen bg-page">
      <RailSkeleton active="hours" />

      <div className="flex min-w-0 flex-1 flex-col">
        <HeaderSkeleton>
          <Skeleton className="h-6 w-24 shrink-0 sm:w-36" />

          <div className="ml-auto shrink-0">
            <DataNoteSkeleton />
          </div>
        </HeaderSkeleton>

        <main className="flex min-w-0 flex-1 flex-col gap-2 px-4 py-6 sm:px-6">
          <Skeleton className="h-5 w-24" />

          <HoursTableSkeleton />
        </main>
      </div>
    </div>
  );
}
