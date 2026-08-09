import Link from "next/link";
import type { ReactNode } from "react";
import { FiBarChart2, FiGrid } from "react-icons/fi";
import type { ViewMode } from "../utils/view-params";

/**
 * A chart section with its own chart/table toggle in the header.
 *
 * Per-card rather than one control for the page: each view answers a different question,
 * and someone reading the duration curve as numbers should not have their heatmap
 * switch underneath them. Each card's mode is its own URL parameter.
 *
 * The toggle is icon-only to match the reference, which is only acceptable because each
 * link carries an `aria-label` — an unnamed icon pair would leave the control
 * unidentifiable, and this one decides whether the data is reachable at all for a
 * screen-reader user.
 */
export function ViewCard({
  title,
  mode,
  chartHref,
  tableHref,
  caption,
  children,
}: {
  title: string;
  mode: ViewMode;
  chartHref: string;
  tableHref: string;
  caption: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="flex flex-col gap-3 rounded-card border border-line bg-surface p-4">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="text-base font-semibold text-fg">{title}</h3>

        <nav aria-label={`${title} view`}>
          <ul className="flex gap-1 rounded-pill border border-line p-1">
            <ToggleLink
              href={chartHref}
              selected={mode === "chart"}
              label={`Show ${title.toLowerCase()} as a chart`}
              Icon={FiBarChart2}
            />
            <ToggleLink
              href={tableHref}
              selected={mode === "table"}
              label={`Show ${title.toLowerCase()} as a table`}
              Icon={FiGrid}
            />
          </ul>
        </nav>
      </header>

      {children}

      <p className="text-sm text-fg-muted">{caption}</p>
    </section>
  );
}

function ToggleLink({
  href,
  selected,
  label,
  Icon,
}: {
  href: string;
  selected: boolean;
  label: string;
  Icon: typeof FiGrid;
}) {
  return (
    <li>
      <Link
        href={href}
        aria-label={label}
        aria-current={selected ? "true" : undefined}
        // Selection carries background *and* border, never colour alone.
        className={
          selected
            ? "flex size-8 items-center justify-center rounded-pill border border-line-selected bg-surface-selected text-on-action-secondary"
            : "flex size-8 items-center justify-center rounded-pill border border-surface text-fg-muted hover:bg-surface-subtle"
        }
      >
        <Icon aria-hidden="true" className="size-4" />
      </Link>
    </li>
  );
}
