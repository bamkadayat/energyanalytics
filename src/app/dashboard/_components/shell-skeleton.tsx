import { Skeleton } from "@/shared/ui";
import { railGroupRows, type RailContentProps } from "./rail-content";

/**
 * Shell placeholders shared by `/dashboard` and `/dashboard/hours`.
 *
 * Both routes draw the shell flat rather than importing the real components: the rail and
 * header read `searchParams`, which a `loading.tsx` never receives. That makes this a
 * hand-copy, so measurements come from the real components and row counts are derived.
 */
export function RailSkeleton({ active }: { active?: RailContentProps["active"] }) {
  const railGroups = railGroupRows(active);

  return (
    <aside
      aria-hidden="true"
      className="sticky top-0 hidden h-screen w-60 shrink-0 flex-col bg-surface-rail lg:flex"
    >
      <div className="border-b border-line-inverse px-4 py-4">
        <div className="h-9 w-40 rounded-control bg-surface-rail-active" />
      </div>

      {/* `flex-1` as the real nav has, or nothing pushes the logout block to the foot. */}
      <div className="flex flex-1 flex-col gap-7 px-3 py-5">
        {railGroups.map((rows, group) => (
          <div key={group} className="flex flex-col gap-1">
            {/* The group label is `pb-2` under a `text-xs` line, not a gap. */}
            <div className="mx-3 mb-2 h-3 w-24 rounded-control bg-surface-rail-active" />

            <div className="flex flex-col gap-0.5">
              {Array.from({ length: rows }, (_, row) => (
                <div key={row} className="h-9 rounded-control bg-surface-rail-active" />
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="border-t border-line-inverse px-3 py-3">
        <div className="h-9 rounded-control bg-surface-rail-active" />
      </div>
    </aside>
  );
}

/** `sticky top-0 z-30` matters: a non-sticky placeholder would shift the page as it resolves. */
export function HeaderSkeleton({ children }: { children: React.ReactNode }) {
  return (
    <header className="sticky top-0 z-30 border-b border-line bg-surface">
      <div className="flex items-center gap-3 px-4 py-3 sm:px-6">
        {/* The drawer trigger, `size-9` and `lg:hidden` like the real one. */}
        <Skeleton className="size-9 lg:hidden" />
        {children}
      </div>
    </header>
  );
}

/** `DataNote`: icon alone below `sm`, icon plus label above it. */
export function DataNoteSkeleton() {
  return <Skeleton className="h-6 w-8 shrink-0 sm:w-32" />;
}
