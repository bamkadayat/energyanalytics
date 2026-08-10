"use client";

import { useEffect, useState, type ReactNode } from "react";
import { FiMaximize2, FiMinimize2 } from "react-icons/fi";
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
  chartMinHeight = "var(--chart-min-height)",
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
  /** Floor for the chart slot. The heatmap needs a taller one: it has 24 rows to fit. */
  chartMinHeight?: string;
  table: ReactNode;
  /** Optional: the day chart's axes are already named by the legend and the axis titles. */
  chartCaption?: ReactNode;
  tableCaption?: ReactNode;
}) {
  const [mode, setMode] = useState<ViewMode>(initialMode);
  const [expanded, setExpanded] = useState(false);
  const caption = mode === "chart" ? chartCaption : (tableCaption ?? chartCaption);

  /*
   * Escape closes it, and the page behind it stops scrolling while it is open — without
   * that, a wheel over the expanded card scrolls the dashboard underneath and the reader
   * comes back to a different place than they left.
   */
  useEffect(() => {
    if (!expanded) {
      return;
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setExpanded(false);
      }
    }

    const { documentElement } = document;
    const previousOverflow = documentElement.style.overflow;
    documentElement.style.overflow = "hidden";
    document.addEventListener("keydown", onKeyDown);

    return () => {
      documentElement.style.overflow = previousOverflow;
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [expanded]);

  /*
   * ECharts sizes its canvas once and then listens for *window* resizes. Expanding the
   * card changes the container without changing the window, so the chart would keep its
   * old dimensions inside a much larger box. Telling it after the browser has laid the
   * new size out is what makes the redraw match the frame.
   */
  function toggleExpanded() {
    setExpanded((current) => !current);
    requestAnimationFrame(() => window.dispatchEvent(new Event("resize")));
  }

  function select(next: ViewMode) {
    setMode(next);

    // Keeps the URL shareable without triggering a navigation or a server render.
    const url = new URL(window.location.href);
    url.searchParams.set(paramKey, next);
    window.history.replaceState(null, "", url);
  }

  return (
    <section
      className={
        expanded
          ? // Over everything, edge to edge. Not a `<dialog>`: focus is not trapped and
            // nothing behind it is inert, so calling it modal would be a lie to a screen
            // reader. It is a panel that fills the window, and Escape closes it.
            "fixed inset-0 z-50 flex min-w-0 flex-col overflow-hidden border-0 bg-surface"
          : "flex min-w-0 flex-col overflow-hidden rounded-card border border-line bg-surface"
      }
    >
      <header className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
        <div className="flex min-w-0 flex-wrap items-center gap-x-5 gap-y-2">
          <h3 className="text-base font-semibold text-fg">{title}</h3>
          {/* Only with the chart: a key to lines nobody is looking at is noise. */}
          {mode === "chart" && legend ? legend : null}
        </div>

        <div className="flex flex-wrap items-center gap-2">
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

          {/*
            Full screen earns its place on the wide views: the heatmap is 24 rows across
            30 day columns, and its table is the same grid in numbers — both are wider
            than a card in a two-column grid can show without scrolling everything.
          */}
          <button
            type="button"
            onClick={toggleExpanded}
            aria-pressed={expanded}
            className="flex items-center gap-2 rounded-control px-2 py-1.5 text-sm text-fg-secondary hover:text-fg focus-visible:outline-focus"
          >
            {expanded ? (
              <FiMinimize2 aria-hidden="true" className="size-4 shrink-0" />
            ) : (
              <FiMaximize2 aria-hidden="true" className="size-4 shrink-0" />
            )}
            {expanded ? "Exit full screen" : "Full screen"}
          </button>
        </div>
      </header>

      {/*
        Chart and table share one ground.
        The chart used to sit on ink, on the argument that thin coloured lines separate
        better against dark. They do — but it made a single panel a different surface
        from every card around it, and switching a card's own background when you press
        Chart/Table reads as navigating rather than as toggling one view of one thing.
        The series clear 3:1 on paper too, so nothing was traded for the consistency.
      */}
      {/* Expanded, the body is what scrolls — the page behind it is locked. */}
      <div
        className={
          expanded
            ? "flex flex-1 flex-col gap-3 overflow-auto px-4 pb-4"
            : "flex flex-1 flex-col gap-3 px-4 pb-4"
        }
      >
        {mode === "chart" ? (
          /*
           * The chart fills whatever height the card ends up with — in a grid row beside
           * a taller column, the alternative is a short chart above a block of empty
           * white. The minimum keeps it readable when the card is the tall one.
           *
           * The inner box is absolutely positioned, and that is load-bearing rather than
           * decorative. ECharts draws into an element sized `height: 100%`, and a
           * percentage height resolves against the parent's *height*, not its
           * `min-height` — so in any layout where the card is not stretched by a grid
           * row, the chart resolves to zero and collapses to a sliver of overlapping
           * axis labels. `inset-0` gives it a definite box in both cases.
           */
          <div className="relative flex-1" style={{ minHeight: chartMinHeight }}>
            <div className="absolute inset-0">{chart}</div>
          </div>
        ) : (
          table
        )}

        {caption ? <p className="text-pretty text-sm text-fg-muted">{caption}</p> : null}
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
