"use client";

import { useEffect, useState, type ReactNode } from "react";
import { FiMaximize2, FiMinimize2 } from "react-icons/fi";
import type { ViewMode } from "../utils/view-params";

/**
 * A chart section with its own chart/table toggle.
 *
 * Both views arrive as server-rendered props, so switching costs no request. The URL
 * tracks the mode via `replaceState` — shareable, no round trip. Buttons, not links:
 * nothing navigates. One toggle per card, since each answers a different question.
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
  /** Optional: the day chart's axes are already named by the legend and the axis titles. */
  chartCaption?: ReactNode;
  tableCaption?: ReactNode;
}) {
  const [mode, setMode] = useState<ViewMode>(initialMode);
  const [expanded, setExpanded] = useState(false);
  const caption = mode === "chart" ? chartCaption : (tableCaption ?? chartCaption);

  // Escape closes it; the page behind is locked so a wheel does not move the dashboard
  // underneath the expanded card.
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

  // ECharts only listens for *window* resizes, and this changes the container. Fire one
  // after layout, or the chart keeps its old size inside the bigger box.
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

          {/* The range views are wider than a card in a two-column grid can show. */}
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
        Chart and table share one ground. The chart sat on ink for a while, which made one
        panel a different surface from every card around it. The series clear 3:1 on paper.
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
           * The chart fills the card, so a stretched row is not padded with white.
           * `inset-0` is load-bearing: ECharts fills `height: 100%`, and a percentage
           * height resolves against the parent's *height*, never its `min-height` — so
           * an unstretched card collapsed the chart to a sliver.
           */
          <div className="relative min-h-[var(--chart-min-height)] flex-1">
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
