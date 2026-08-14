import Link from "next/link";
import { connection } from "next/server";
import { FiCalendar } from "react-icons/fi";
import { hrefWith, type ViewParams } from "@/features/market-correlation/client";
import { type DaySelection } from "@/shared/config";
import { formatOsloDate, formatOsloDateShort } from "@/shared/lib/format-oslo";
import { Skeleton } from "@/shared/ui";
import { resolveOsloDay } from "@/shared/lib/oslo-day";

const DAYS: ReadonlyArray<{ value: DaySelection; label: string }> = [
  { value: "today", label: "Today" },
  { value: "tomorrow", label: "Tomorrow" },
];

/**
 * The day, as a segmented control — once, in the widest-reaching piece of chrome. There
 * used to be two of these for one piece of state.
 *
 * Links, not buttons: a chosen day is shareable and the back button steps through them.
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
                // Changing the day re-renders the views in place; it is not a reason to
                // send the reader back to the top of the page.
                scroll={false}
                aria-current={selected ? "page" : undefined}
                // Fill plus weight, so selection is never carried by colour alone.
                className={
                  selected
                    ? "block rounded-pill bg-surface px-3 py-1.5 text-sm font-medium text-fg sm:px-4"
                    : "block rounded-pill px-3 py-1.5 text-sm text-fg-secondary hover:text-fg sm:px-4"
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
 * The resolved date. "Today" is relative, and a dashboard left open overnight keeps
 * showing it; this is the absolute answer. Async because it reads the clock, so it
 * streams behind its own boundary.
 *
 * A chip, not a picker: this app derives its span from the day preset, so a control that
 * opens nothing would be a dead one.
 */
export async function DateChip({ params }: { params: ViewParams }) {
  await connection();

  const day = resolveOsloDay(new Date(), params.day);

  return (
    <ChipShell>
      {/* The weekday and year are what a narrow screen can afford to lose. */}
      <span className="sm:hidden">{formatOsloDateShort(day)}</span>
      <span className="hidden sm:inline">{formatOsloDate(day)}</span>
    </ChipShell>
  );
}

/** Holds the chip's exact footprint while the date resolves, so the header cannot jump. */
export function DateChipPlaceholder() {
  return (
    <ChipShell>
      {/* The shared skeleton block, so this pulses like every other pending region. */}
      <Skeleton className="h-4 w-16 sm:w-36" />
      <span className="sr-only">Resolving the date…</span>
    </ChipShell>
  );
}

/*
 * A `<div>`, not a `<p>`.
 *
 * `DateChipPlaceholder` puts a `Skeleton` in here, and `Skeleton` is a `<div>` — which is
 * not valid inside a `<p>`. The browser closes the paragraph before the div, so the server
 * HTML and the client tree disagree and React reports a hydration error.
 *
 * Fixed here rather than by making `Skeleton` a `<span>`: this is a chip holding a date
 * and an icon, not a paragraph of prose, so `<p>` was the wrong element regardless. The
 * classes already say `flex`, so nothing about the layout changes.
 */
function ChipShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-w-0 items-center gap-2 truncate rounded-control border border-line bg-surface px-2 py-1.5 font-mono text-xs text-fg-secondary sm:px-3 sm:text-sm">
      <FiCalendar aria-hidden="true" className="size-4 shrink-0 text-fg-muted" />
      {children}
    </div>
  );
}
