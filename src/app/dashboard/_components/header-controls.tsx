import Link from "next/link";
import { connection } from "next/server";
import { FiCalendar } from "react-icons/fi";
import { hrefWith, type ViewParams } from "@/features/market-correlation/client";
import { PRICE_AREA, WEATHER_LOCATION, type DaySelection } from "@/shared/config";
import { formatOsloDate } from "@/shared/lib/format-oslo";
import { resolveOsloDay } from "@/shared/lib/oslo-day";

const DAYS: ReadonlyArray<{ value: DaySelection; label: string }> = [
  { value: "today", label: "Today" },
  { value: "tomorrow", label: "Tomorrow" },
];

/**
 * The day, as a segmented control in the header.
 *
 * There used to be two of these — one in the rail, one above the chart — for a single
 * piece of state. Two controls for one value is two places to look when the wrong day is
 * showing, and two things to keep in sync. The day is the widest-reaching filter on the
 * page, so it sits in the widest-reaching piece of chrome, once.
 *
 * Links, not buttons: a chosen day is shareable and the back button steps through the
 * previous ones. No clock is read here, so this renders in the static header.
 */
export function DaySwitch({ params }: { params: ViewParams }) {
  return (
    <nav aria-label="Day">
      <ul className="flex gap-0.5 rounded-pill bg-surface-subtle p-0.5">
        {DAYS.map((day) => {
          const selected = params.day === day.value;

          return (
            <li key={day.value}>
              <Link
                href={hrefWith(params, { day: day.value })}
                aria-current={selected ? "page" : undefined}
                // Fill plus weight, so selection is never carried by colour alone.
                className={
                  selected
                    ? "block rounded-pill bg-surface px-4 py-1.5 text-sm font-medium text-fg shadow-card"
                    : "block rounded-pill px-4 py-1.5 text-sm text-fg-secondary hover:text-fg"
                }
              >
                {day.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

/**
 * What the numbers on this page describe: the price area, and the one point inside it the
 * weather is measured at. Two caveats this page must never bury, so they sit beside the
 * day rather than in a footnote.
 */
export function ScopeLine() {
  return (
    <p className="hidden min-w-0 items-center gap-2 font-mono text-xs text-fg-muted sm:flex">
      <span aria-hidden="true" className="size-1.5 shrink-0 rounded-pill bg-price-low" />
      <span className="truncate">
        {PRICE_AREA.label} · {WEATHER_LOCATION.label}
      </span>
    </p>
  );
}

/**
 * The resolved date, spelled out.
 *
 * "Today" is a relative label, and a dashboard left open overnight will happily keep
 * showing it. This is the absolute answer, and it is the reason the component is async:
 * resolving it reads the clock, so it renders behind its own Suspense boundary rather
 * than making the whole header wait.
 *
 * A chip, not a picker. The reference design makes it a date-range control; this app
 * derives its span from the day preset, so a button opening nothing would be a dead
 * control. Stated as read-only text it answers the question the picker exists to answer.
 */
export async function DateChip({ params }: { params: ViewParams }) {
  await connection();

  return <ChipShell>{formatOsloDate(resolveOsloDay(new Date(), params.day))}</ChipShell>;
}

/** Holds the chip's exact footprint while the date resolves, so the header cannot jump. */
export function DateChipPlaceholder() {
  return (
    <ChipShell>
      <span aria-hidden="true" className="inline-block h-4 w-36 rounded-control bg-surface-subtle" />
      <span className="sr-only">Resolving the date…</span>
    </ChipShell>
  );
}

function ChipShell({ children }: { children: React.ReactNode }) {
  return (
    <p className="flex items-center gap-2 rounded-control border border-line bg-surface px-3 py-1.5 font-mono text-sm text-fg-secondary">
      <FiCalendar aria-hidden="true" className="size-4 shrink-0 text-fg-muted" />
      {children}
    </p>
  );
}
