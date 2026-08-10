"use client";
/* The compiler cannot memoize `useReactTable`; the directive must sit in the prologue. */
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

/** Enough to land at roughly the chart's height, so Chart/Table does not resize the card. */
const INITIAL_ROWS = 8;
const ROWS_PER_STEP = 8;

/**
 * The hourly table, sortable via TanStack. Headless, so the markup and classes stay ours
 * and no second token system arrives with it.
 *
 * Sorting earns its place: the question is rarely "what happened at 14:00" but "when was
 * it cheapest". Nulls sort last either way — a missing hour is not a cheap one.
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

  /* The lint rule fires statically, so the directive above does not clear it. */
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

  // Sort over every hour, then cut — not "the cheapest of the eight you can see".
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
        A count and one control: 24 hours is not something anyone pages through.
        `aria-live`, because rows appearing below the fold are silent otherwise.
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
