import { WEATHER_METRIC_IDS } from "@/shared/config";
import { Skeleton } from "@/shared/ui";
import { RAIL_VIEW_COUNT } from "./rail-content";

/**
 * The dashboard shell's placeholders, shared by `/dashboard` and `/dashboard/hours`.
 *
 * Both routes draw the shell flat rather than importing the real components, because the
 * rail and header read `searchParams` and a `loading.tsx` does not receive them. That is
 * unavoidable — but it means the placeholders are a hand-copy of a layout that keeps
 * changing, and the two files had already drifted from it and from each other. Sharing
 * them at least reduces that to one copy to keep honest.
 *
 * The measurements are taken from the real components, not guessed:
 *
 * - the rail is `w-60`, its brand block `px-4 py-4`, its nav `flex-1 gap-7 px-3 py-5`
 * - a rail row is `px-3 py-2 text-sm` — 36px, so `h-9`
 * - the foot carries logout behind a `border-t`, which is what both files were missing
 *
 * The row counts are **derived**, not written as `[3, 3]`. They were literals, and a
 * fourth weather metric would have left the skeleton a row short with nothing to catch
 * it — the same silent-drift problem as the copied shell itself.
 */
const RAIL_GROUPS = [WEATHER_METRIC_IDS.length, RAIL_VIEW_COUNT] as const;
export function RailSkeleton() {
  return (
    <aside
      aria-hidden="true"
      className="sticky top-0 hidden h-screen w-60 shrink-0 flex-col bg-surface-rail lg:flex"
    >
      <div className="border-b border-line-inverse px-4 py-4">
        <div className="h-9 w-40 rounded-control bg-surface-rail-active" />
      </div>

      {/*
        `flex-1`, as the real nav has. Without it nothing pushes the logout block down and
        the foot of the rail arrives somewhere different from where it was reserved.
      */}
      <div className="flex flex-1 flex-col gap-7 px-3 py-5">
        {RAIL_GROUPS.map((rows, group) => (
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

      {/* Logout. Present in both rails and in neither skeleton until now. */}
      <div className="border-t border-line-inverse px-3 py-3">
        <div className="h-9 rounded-control bg-surface-rail-active" />
      </div>
    </aside>
  );
}

/**
 * The header shell. `sticky top-0 z-30` matters: both real headers stick, and a
 * non-sticky placeholder resolving into a sticky bar shifts the page under a reader who
 * has already started scrolling.
 */
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

/**
 * `DataNote` — an icon plus "How to read this", which appears only from `sm`. Below that
 * the trigger is the icon alone, so the placeholder narrows with it rather than reserving
 * a phone-width block for a 16px icon.
 */
export function DataNoteSkeleton() {
  return <Skeleton className="h-6 w-8 shrink-0 sm:w-32" />;
}
