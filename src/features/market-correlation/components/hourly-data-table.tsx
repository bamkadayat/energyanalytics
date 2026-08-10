"use client";
/*
 * React Compiler cannot safely memoize the functions `useReactTable` returns, so this
 * file opts out of auto-memoization. TanStack's documented answer, and it must sit in
 * the file prologue beside "use client" to be recognised.
 */
"use no memo";

import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
  type SortingState,
} from "@tanstack/react-table";
import { useMemo, useState } from "react";
import { FiChevronDown, FiChevronUp } from "react-icons/fi";
import { PRICE_UNIT, WEATHER_METRICS, type WeatherMetricId } from "@/shared/config";
import { formatMetricValue, formatPrice, MISSING_VALUE } from "@/shared/lib/format-number";
import { formatOsloTime } from "@/shared/lib/format-oslo";
import { Button } from "@/shared/ui";

export interface HourRow {
  hour: Date;
  nokPerKwh: number | null;
  metricValue: number | null;
}

const columnHelper = createColumnHelper<HourRow>();

/**
 * How many rows show before the reader asks for more.
 *
 * Chosen so the table lands at roughly the chart's height: switching Chart/Table should
 * change what the card shows, not how much room it takes on the page.
 */
const INITIAL_ROWS = 8;
const ROWS_PER_STEP = 8;

/**
 * The hourly table, made sortable with TanStack Table.
 *
 * Headless: TanStack owns sorting state and row order, the markup and every class stay
 * ours. That is why it earned its place over a component library — no second token
 * system, and the semantics built earlier survive intact (hours as row headers, the
 * caption explaining that an em dash means *no reading*, tabular numerals).
 *
 * Sorting matters here because the question is rarely "what happened at 14:00" but "when
 * was it cheapest" — and re-sorting is instant on data already in the browser.
 *
 * Nulls always sort last regardless of direction: a missing hour is not cheap.
 */
export function HourlyDataTable({
  rows,
  metricId,
  caption,
}: {
  rows: HourRow[];
  metricId: WeatherMetricId;
  caption: string;
}) {
  const metric = WEATHER_METRICS[metricId];
  const [sorting, setSorting] = useState<SortingState>([]);
  const [visibleRows, setVisibleRows] = useState(INITIAL_ROWS);

  const columns = useMemo(
    () => [
      columnHelper.accessor("hour", {
        header: "Hour",
        cell: (info) => formatOsloTime(info.getValue()),
        sortingFn: "datetime",
      }),
      columnHelper.accessor("nokPerKwh", {
        header: `Spot price (${PRICE_UNIT})`,
        cell: (info) => formatPrice(info.getValue()),
        sortUndefined: "last",
      }),
      columnHelper.accessor("metricValue", {
        header: `${metric.label} (${metric.unit})`,
        cell: (info) => formatMetricValue(info.getValue()),
        sortUndefined: "last",
      }),
    ],
    [metric.label, metric.unit],
  );

  /*
   * The rule fires on the library statically, so the file's "use no memo" directive does
   * not clear it — the directive tells the compiler to skip this file, the disable tells
   * the linter the skip was deliberate. Scoped to this line so the rule keeps working
   * everywhere else.
   */
  // eslint-disable-next-line react-hooks/incompatible-library -- opted out via "use no memo"
  const table = useReactTable({
    data: rows,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    // A missing hour is not a cheap hour — keep gaps out of the extremes either way.
    sortDescFirst: true,
  });

  /*
   * Sort over every hour, then cut. Sorting only the visible slice would answer "the
   * cheapest of the eight you happen to be looking at", which is not the question the
   * column heading offers to answer.
   */
  const sortedRows = table.getRowModel().rows;
  const shownRows = sortedRows.slice(0, visibleRows);
  const remaining = sortedRows.length - shownRows.length;

  return (
    <div className="flex flex-col gap-3">
      <div className="overflow-x-auto rounded-control border border-line">
      <table className="w-full border-collapse text-sm">
        <caption className="px-4 py-3 text-left text-xs text-fg-muted">
          {caption} {MISSING_VALUE} marks an hour with no reading — not a value of zero.
          Select a column heading to sort.
        </caption>

        <thead>
          {table.getHeaderGroups().map((headerGroup) => (
            <tr key={headerGroup.id} className="border-b border-line text-left">
              {headerGroup.headers.map((header, index) => {
                const sorted = header.column.getIsSorted();

                return (
                  <th
                    key={header.id}
                    scope="col"
                    // The sort state, announced rather than left to the icon alone.
                    aria-sort={
                      sorted === "asc"
                        ? "ascending"
                        : sorted === "desc"
                          ? "descending"
                          : "none"
                    }
                    className={`px-4 py-2 font-medium text-fg-muted ${index === 0 ? "" : "text-right"}`}
                  >
                    <button
                      type="button"
                      onClick={header.column.getToggleSortingHandler()}
                      className={`inline-flex items-center gap-1.5 rounded-control hover:text-fg ${
                        index === 0 ? "" : "flex-row-reverse"
                      }`}
                    >
                      {flexRender(header.column.columnDef.header, header.getContext())}
                      {sorted === "asc" ? (
                        <FiChevronUp aria-hidden="true" className="size-3.5" />
                      ) : sorted === "desc" ? (
                        <FiChevronDown aria-hidden="true" className="size-3.5" />
                      ) : null}
                    </button>
                  </th>
                );
              })}
            </tr>
          ))}
        </thead>

        <tbody>
          {shownRows.map((row) => {
            const cells = row.getVisibleCells();

            return (
              <tr key={row.id} className="border-b border-line last:border-0">
                {cells.map((cell, index) =>
                  index === 0 ? (
                    // The hour stays a row header, so each value is announced with it.
                    <th
                      key={cell.id}
                      scope="row"
                      className="px-4 py-2 text-left font-mono font-normal text-fg-secondary"
                    >
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </th>
                  ) : (
                    <td
                      key={cell.id}
                      className="px-4 py-2 text-right font-mono tabular-nums text-fg"
                    >
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ),
                )}
              </tr>
            );
          })}
        </tbody>
      </table>
      </div>

      {/*
        A count and one control, rather than page numbers. Twenty-four hours is not a
        data set anyone pages through — the reader wants the first few, or all of them.
        `aria-live` announces the new total, because pressing a button and having rows
        appear silently below the viewport is invisible to a screen reader.
      */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p aria-live="polite" className="font-mono text-xs text-fg-muted">
          Showing {shownRows.length} of {sortedRows.length} hours
        </p>

        {remaining > 0 ? (
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              setVisibleRows((current) =>
                Math.min(sortedRows.length, current + ROWS_PER_STEP),
              )
            }
          >
            Show {Math.min(ROWS_PER_STEP, remaining)} more
          </Button>
        ) : sortedRows.length > INITIAL_ROWS ? (
          <Button variant="outline" size="sm" onClick={() => setVisibleRows(INITIAL_ROWS)}>
            Show fewer
          </Button>
        ) : null}
      </div>
    </div>
  );
}
