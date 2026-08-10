"use client";

import { useState, type ReactNode } from "react";
import { FiBarChart2, FiGrid } from "react-icons/fi";
import type { ViewMode } from "../utils/view-params";

/**
 * A chart section with its own chart/table toggle in the header.
 *
 * **Both views are rendered on the server and handed in as props**, so switching is
 * instant — no request, no re-render of the page, no Suspense fallback flashing, no
 * scroll jump. Server components can be passed as children of a client component, which
 * is what makes this possible: the table's markup is already here by the time you click.
 *
 * The URL still tracks the mode, but through `history.replaceState` rather than a
 * navigation. That keeps the view shareable and the server render correct on a fresh
 * load, without paying a round trip for a control whose data is already on the page.
 *
 * These are `<button aria-pressed>`, not links, because nothing navigates. A link that
 * does not go anywhere lies to anyone using a keyboard or a screen reader.
 *
 * One toggle per card, not one for the page: each view answers a different question, and
 * reading the duration curve as numbers should not switch the heatmap underneath you.
 */
export function ViewCard({
  title,
  paramKey,
  initialMode,
  chart,
  table,
  chartCaption,
  tableCaption,
}: {
  title: string;
  /** Search-param key this card owns, e.g. `heatmap`. */
  paramKey: string;
  initialMode: ViewMode;
  chart: ReactNode;
  table: ReactNode;
  chartCaption: ReactNode;
  tableCaption?: ReactNode;
}) {
  const [mode, setMode] = useState<ViewMode>(initialMode);

  function select(next: ViewMode) {
    setMode(next);

    // Keeps the URL shareable without triggering a navigation or a server render.
    const url = new URL(window.location.href);
    url.searchParams.set(paramKey, next);
    window.history.replaceState(null, "", url);
  }

  return (
    <section className="flex min-w-0 flex-col gap-3 rounded-card border border-line bg-surface p-4">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="text-base font-semibold text-fg">{title}</h3>

        <div
          role="group"
          aria-label={`${title} view`}
          className="flex gap-1 rounded-pill border border-line p-1"
        >
          <ToggleButton
            selected={mode === "chart"}
            onSelect={() => select("chart")}
            label={`Show ${title.toLowerCase()} as a chart`}
            Icon={FiBarChart2}
          />
          <ToggleButton
            selected={mode === "table"}
            onSelect={() => select("table")}
            label={`Show ${title.toLowerCase()} as a table`}
            Icon={FiGrid}
          />
        </div>
      </header>

      {mode === "chart" ? chart : table}

      <p className="text-sm text-fg-muted">
        {mode === "chart" ? chartCaption : (tableCaption ?? chartCaption)}
      </p>
    </section>
  );
}

function ToggleButton({
  selected,
  onSelect,
  label,
  Icon,
}: {
  selected: boolean;
  onSelect: () => void;
  label: string;
  Icon: typeof FiGrid;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-label={label}
      // The state of a toggle, which aria-current cannot express on a non-link.
      aria-pressed={selected}
      className={
        selected
          ? "flex size-8 items-center justify-center rounded-pill border border-line-selected bg-surface-selected text-on-action-secondary"
          : "flex size-8 items-center justify-center rounded-pill border border-surface text-fg-muted hover:bg-surface-subtle"
      }
    >
      <Icon aria-hidden="true" className="size-4" />
    </button>
  );
}
