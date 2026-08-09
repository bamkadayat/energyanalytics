import Link from "next/link";
import { FiBarChart2, FiGrid } from "react-icons/fi";
import { hrefWith, type ViewMode, type ViewParams } from "../utils/view-params";

const MODES: ReadonlyArray<{
  value: ViewMode;
  label: string;
  Icon: typeof FiGrid;
}> = [
  { value: "chart", label: "Chart", Icon: FiBarChart2 },
  { value: "table", label: "Table", Icon: FiGrid },
];

/**
 * Switches the day's data between the chart and the table.
 *
 * Links, not client state — the mode lives in the URL like every other view parameter,
 * so a table view is shareable and the back button works.
 *
 * The labels are visible, not icon-only. An icon pair alone would leave the control
 * unlabelled for anyone who does not recognise the glyphs, and this toggle decides
 * whether the data is reachable at all for a screen-reader user.
 */
export function ViewModeToggle({ params }: { params: ViewParams }) {
  return (
    <nav aria-label="Data view" className="flex flex-col gap-2">
      <span className="font-mono text-xs uppercase tracking-wider text-fg-muted">
        View
      </span>

      <ul className="flex flex-wrap gap-1 rounded-pill border border-line bg-surface p-1">
        {MODES.map(({ value, label, Icon }) => {
          const selected = params.view === value;

          return (
            <li key={value}>
              <Link
                href={hrefWith(params, { view: value })}
                aria-current={selected ? "page" : undefined}
                className={
                  selected
                    ? "flex items-center gap-2 rounded-pill border border-line-selected bg-surface-selected px-4 py-1.5 text-sm font-medium text-on-action-secondary"
                    : "flex items-center gap-2 rounded-pill border border-surface px-4 py-1.5 text-sm text-fg-secondary hover:bg-surface-subtle"
                }
              >
                <Icon aria-hidden="true" className="size-4 shrink-0" />
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
