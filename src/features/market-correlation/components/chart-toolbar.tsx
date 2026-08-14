import Link from "next/link";
import { FiCalendar } from "react-icons/fi";

export interface ToolbarPreset {
  key: string;
  label: string;
  href: string;
  selected: boolean;
}

/**
 * The toolbar above a chart section: range presets on the left, the period covered on
 * the right.
 *
 * The presets are links, so a chosen range is shareable and the back button steps through
 * previous ones.
 *
 * The period is a **chip, not a button**. The reference design makes it a date-range
 * picker; this app derives its span from the preset, so a button opening nothing would be
 * a dead control. Stated as read-only text, it answers the question the picker exists to
 * answer — "what am I actually looking at?" — without pretending to be interactive.
 */
export function ChartToolbar({
  label,
  presets,
  period,
}: {
  label: string;
  presets: ToolbarPreset[];
  period: string;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <nav aria-label={label}>
        <ul className="flex flex-wrap gap-0.5 rounded-control border border-line bg-page p-0.5">
          {presets.map((preset) => (
            <li key={preset.key}>
              <Link
                href={preset.href}
                /*
                 * Stay where the reader is. This toolbar sits far down the page, so the
                 * Page element is out of the viewport and Next's default is to scroll to
                 * the top of it — changing a filter would throw the chart you are
                 * looking at off screen.
                 */
                scroll={false}
                aria-current={preset.selected ? "page" : undefined}
                // Fill plus weight, so selection is never carried by colour alone.
                className={
                  preset.selected
                    ? "block rounded-control border border-line bg-surface px-3 py-1.5 text-sm font-medium text-fg"
                    : // Same border width in the container's colour, so selecting cannot
                      // shift the row.
                      "block rounded-control border border-page px-3 py-1.5 text-sm text-fg-secondary hover:text-fg"
                }
              >
                {preset.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      <p className="flex items-center gap-2 rounded-control border border-line bg-surface px-3 py-1.5 font-mono text-sm text-fg-secondary">
        <FiCalendar aria-hidden="true" className="size-4 shrink-0 text-fg-muted" />
        {period}
      </p>
    </div>
  );
}
