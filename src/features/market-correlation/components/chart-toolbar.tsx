import Link from "next/link";
import { FiCalendar } from "react-icons/fi";

export interface ToolbarPreset {
  key: string;
  label: string;
  href: string;
  selected: boolean;
}

/**
 * Range presets on the left, the period covered on the right. Presets are links, so a
 * range is shareable. The period is a read-only chip, not a button — its span comes from
 * the preset, so a picker here would be a control that opens nothing.
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
