"use client";

import { useState, type ReactNode } from "react";
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
  legend,
  chart,
  table,
  chartCaption,
  tableCaption,
}: {
  title: string;
  /** Search-param key this card owns, e.g. `heatmap`. */
  paramKey: string;
  initialMode: ViewMode;
  /** Series key, shown beside the title while the chart is up. */
  legend?: ReactNode;
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
    <section className="flex min-w-0 flex-col overflow-hidden rounded-card border border-line bg-surface">
      <header className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
        <div className="flex min-w-0 flex-wrap items-center gap-x-5 gap-y-2">
          <h3 className="text-base font-semibold text-fg">{title}</h3>
          {/* Only with the chart: a key to lines nobody is looking at is noise. */}
          {mode === "chart" && legend ? legend : null}
        </div>

        <div
          role="group"
          aria-label={`${title} view`}
          className="flex gap-0.5 rounded-pill bg-surface-subtle p-0.5"
        >
          <ToggleButton
            selected={mode === "chart"}
            onSelect={() => select("chart")}
            label="Chart"
            description={`Show ${title.toLowerCase()} as a chart`}
          />
          <ToggleButton
            selected={mode === "table"}
            onSelect={() => select("table")}
            label="Table"
            description={`Show ${title.toLowerCase()} as a table`}
          />
        </div>
      </header>

      {/*
        The chart sits on ink, the table on paper.
        A canvas of thin coloured lines holds together far better against a dark ground —
        the series separate, and the panel reads as an instrument rather than as an image
        pasted into a document. A table is text, and text belongs on paper.
      */}
      <div
        className={
          mode === "chart"
            ? "flex flex-col gap-3 bg-surface-inverse px-4 pb-4 pt-2 text-fg-inverse"
            : "flex flex-col gap-3 px-4 pb-4"
        }
      >
        {mode === "chart" ? chart : table}

        <p
          className={
            mode === "chart"
              ? "text-pretty text-sm text-fg-inverse-muted"
              : "text-pretty text-sm text-fg-muted"
          }
        >
          {mode === "chart" ? chartCaption : (tableCaption ?? chartCaption)}
        </p>
      </div>
    </section>
  );
}

function ToggleButton({
  selected,
  onSelect,
  label,
  description,
}: {
  selected: boolean;
  onSelect: () => void;
  label: string;
  description: string;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      // The visible word is the name; the description says what pressing it does.
      aria-label={description}
      // The state of a toggle, which aria-current cannot express on a non-link.
      aria-pressed={selected}
      className={
        selected
          ? "rounded-pill bg-surface px-4 py-1.5 text-sm font-medium text-fg shadow-card"
          : "rounded-pill px-4 py-1.5 text-sm text-fg-secondary hover:text-fg"
      }
    >
      {label}
    </button>
  );
}
