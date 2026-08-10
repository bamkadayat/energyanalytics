"use client";
/* As in `hourly-data-table.tsx`: the compiler cannot memoize `useReactTable`. */
"use no memo";

import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnFiltersState,
  type SortingState,
} from "@tanstack/react-table";
import { useVirtualizer } from "@tanstack/react-virtual";
import { useMemo, useRef, useState } from "react";
import { FiChevronDown, FiChevronUp, FiSearch } from "react-icons/fi";
import { PRICE_UNIT, WEATHER_METRICS } from "@/shared/config";
import {
  formatCount,
  formatMetricValue,
  formatPrice,
  MISSING_VALUE,
} from "@/shared/lib/format-number";
import { Button } from "@/shared/ui";
import type { HourRecord } from "../utils/derive-hour-rows";

/** Row height in pixels. Fixed, because the virtualizer measures before it paints. */
const ROW_HEIGHT = 40;

/** Rows drawn beyond the viewport on each side, so a fast scroll does not show gaps. */
const OVERSCAN = 12;

/**
 * First-render guess only. The real height is `--table-height`, a viewport clamp the
 * server cannot know; the virtualizer measures and corrects on mount.
 */
const SCROLLER_HEIGHT = 640;

const PAGE_SIZES = [100, 500, 1000] as const;

const columnHelper = createColumnHelper<HourRecord>();

/**
 * Reads a numeric column, turning a gap into `undefined`.
 *
 * TanStack's `sortUndefined` recognises **only** `undefined`; a `null` falls through to
 * the default comparator, where it behaves as zero — a missing temperature sorting
 * between -8 °C and 4 °C. `"last"` applies before the descending inversion, so gaps stay
 * at the end whichever way the column points.
 */
function present(value: number | null): number | undefined {
  return value ?? undefined;
}

/**
 * A few thousand hours as one scrollable table.
 *
 * - **Rendering:** only the visible window is mounted (`useVirtualizer`), ~25 rows.
 * - **Sorting and filtering:** run over the whole set, not the page — sorting a page
 *   would answer "the cheapest of the hundred you are looking at".
 * - **Semantics:** virtualized rows are absent and misstate their position, so
 *   `aria-rowcount` and `aria-rowindex` put both back.
 *
 * The grid-display layout drops the implicit table roles, so each is written explicitly.
 */
export function HoursTable({ rows }: { rows: HourRecord[] }) {
  const [sorting, setSorting] = useState<SortingState>([{ id: "at", desc: true }]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [search, setSearch] = useState("");
  const [pricedOnly, setPricedOnly] = useState(false);

  const columns = useMemo(
    () => [
      columnHelper.accessor("at", {
        header: "Hour",
        size: 200,
        cell: (info) => info.row.original.label,
        // The label is text; the instant is what "earliest first" actually means.
        sortingFn: "basic",
        filterFn: (row, _columnId, value: string) =>
          row.original.label.toLowerCase().includes(value.toLowerCase()),
      }),
      columnHelper.accessor((row) => present(row.price), {
        id: "price",
        header: `Spot price (${PRICE_UNIT})`,
        size: 160,
        cell: (info) => formatPrice(info.getValue()),
        sortUndefined: "last",
      }),
      columnHelper.accessor((row) => present(row.temperature), {
        id: "temperature",
        header: `${WEATHER_METRICS.temperature.label} (${WEATHER_METRICS.temperature.unit})`,
        size: 150,
        cell: (info) => formatMetricValue(info.getValue()),
        sortUndefined: "last",
      }),
      columnHelper.accessor((row) => present(row.wind), {
        id: "wind",
        header: `${WEATHER_METRICS.wind.label} (${WEATHER_METRICS.wind.unit})`,
        size: 150,
        cell: (info) => formatMetricValue(info.getValue()),
        sortUndefined: "last",
      }),
      columnHelper.accessor((row) => present(row.solar), {
        id: "solar",
        header: `${WEATHER_METRICS.solar.label} (${WEATHER_METRICS.solar.unit})`,
        size: 160,
        cell: (info) => formatMetricValue(info.getValue()),
        sortUndefined: "last",
      }),
    ],
    [],
  );

  // Not a column filter: "has a price" is a property of the row, not of one column.
  const data = useMemo(
    () => (pricedOnly ? rows.filter((row) => row.price !== null) : rows),
    [rows, pricedOnly],
  );

  // eslint-disable-next-line react-hooks/incompatible-library -- opted out via "use no memo"
  const table = useReactTable({
    data,
    columns,
    state: { sorting, columnFilters, globalFilter: search },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onGlobalFilterChange: setSearch,
    globalFilterFn: (row, _columnId, value: string) =>
      row.original.label.toLowerCase().includes(String(value).toLowerCase()),
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageSize: PAGE_SIZES[0] } },
    sortDescFirst: true,
  });

  const pageRows = table.getRowModel().rows;
  const scroller = useRef<HTMLDivElement>(null);

  const virtualizer = useVirtualizer({
    count: pageRows.length,
    getScrollElement: () => scroller.current,
    estimateSize: () => ROW_HEIGHT,
    overscan: OVERSCAN,
    // Assumed until measured: `offsetHeight` is 0 before layout, and without a fallback
    // rect the first render decides the viewport is empty and draws nothing.
    initialRect: { width: 900, height: SCROLLER_HEIGHT },
  });

  const filtered = table.getFilteredRowModel().rows.length;
  const { pageIndex, pageSize } = table.getState().pagination;
  const firstOnPage = filtered === 0 ? 0 : pageIndex * pageSize + 1;
  const lastOnPage = pageIndex * pageSize + pageRows.length;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-end gap-3">
        <label className="flex min-w-0 flex-1 flex-col gap-1 sm:max-w-xs">
          <span className="font-mono text-[0.6875rem] uppercase tracking-wider text-fg-muted">
            Find an hour
          </span>
          <span className="relative flex items-center">
            <FiSearch
              aria-hidden="true"
              className="pointer-events-none absolute left-3 size-4 text-fg-muted"
            />
            <input
              type="search"
              value={search}
              onChange={(event) => {
                setSearch(event.target.value);
                table.setPageIndex(0);
              }}
              placeholder="10.08, 14:00, august…"
              className="w-full rounded-control border border-line bg-surface py-2 pl-9 pr-3 text-sm text-fg placeholder:text-fg-muted focus-visible:outline-focus"
            />
          </span>
        </label>

        <label className="flex items-center gap-2 py-2 text-sm text-fg-secondary">
          <input
            type="checkbox"
            checked={pricedOnly}
            onChange={(event) => {
              setPricedOnly(event.target.checked);
              table.setPageIndex(0);
            }}
            className="size-4 rounded-[3px] border-line accent-action-primary"
          />
          Only hours with a price
        </label>

        <label className="ml-auto flex items-center gap-2 text-sm text-fg-secondary">
          Rows per page
          <select
            value={pageSize}
            onChange={(event) => table.setPageSize(Number(event.target.value))}
            className="rounded-control border border-line bg-surface px-2 py-1.5 text-sm text-fg focus-visible:outline-focus"
          >
            {PAGE_SIZES.map((size) => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
          </select>
        </label>
      </div>

      {/* Focusable: virtualized rows leave the keyboard nothing inside to tab to. */}
      <div
        ref={scroller}
        tabIndex={0}
        aria-label="All hours"
        className="h-[var(--table-height)] overflow-auto rounded-control border border-line focus-visible:outline-focus"
      >
        <table
          role="table"
          aria-rowcount={filtered}
          className="grid w-full text-sm"
          style={{ minWidth: "48rem" }}
        >
          <thead role="rowgroup" className="sticky top-0 z-10 grid bg-surface-subtle">
            {table.getHeaderGroups().map((headerGroup) => (
              <tr
                role="row"
                key={headerGroup.id}
                className="flex w-full border-b border-line"
              >
                {headerGroup.headers.map((header, index) => {
                  const sorted = header.column.getIsSorted();

                  return (
                    <th
                      role="columnheader"
                      key={header.id}
                      scope="col"
                      aria-sort={
                        sorted === "asc"
                          ? "ascending"
                          : sorted === "desc"
                            ? "descending"
                            : "none"
                      }
                      style={{ width: header.getSize() }}
                      className={`flex shrink-0 grow items-center px-4 py-2 font-medium text-fg-muted ${
                        index === 0 ? "" : "justify-end"
                      }`}
                    >
                      <button
                        type="button"
                        onClick={header.column.getToggleSortingHandler()}
                        className="inline-flex items-center gap-1.5 rounded-control hover:text-fg"
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

          {/* Full-height tbody, rows positioned into it — so the scrollbar stays honest. */}
          <tbody
            role="rowgroup"
            className="relative grid"
            style={{ height: `${virtualizer.getTotalSize()}px` }}
          >
            {virtualizer.getVirtualItems().map((virtualRow) => {
              const row = pageRows[virtualRow.index];

              return (
                <tr
                  role="row"
                  key={row.id}
                  // Its position in the *filtered* set, not in the DOM.
                  aria-rowindex={pageIndex * pageSize + virtualRow.index + 1}
                  ref={virtualizer.measureElement}
                  data-index={virtualRow.index}
                  className="absolute flex w-full border-b border-line last:border-0 hover:bg-surface-subtle"
                  style={{ transform: `translateY(${virtualRow.start}px)` }}
                >
                  {row.getVisibleCells().map((cell, index) =>
                    index === 0 ? (
                      <th
                        role="rowheader"
                        key={cell.id}
                        scope="row"
                        style={{ width: cell.column.getSize() }}
                        className="flex shrink-0 grow items-center px-4 py-2 text-left font-mono font-normal text-fg-secondary"
                      >
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </th>
                    ) : (
                      <td
                        role="cell"
                        key={cell.id}
                        style={{ width: cell.column.getSize() }}
                        className="flex shrink-0 grow items-center justify-end px-4 py-2 font-mono tabular-nums text-fg"
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

      {filtered === 0 ? (
        <p className="text-sm text-fg-secondary">
          No hour matches that search. Clear it to see the whole range again.
        </p>
      ) : null}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p aria-live="polite" className="font-mono text-xs text-fg-muted">
          {firstOnPage}–{lastOnPage} of {formatCount(filtered)} hours
          {filtered === rows.length ? "" : ` (filtered from ${formatCount(rows.length)})`}
          {" · "}
          {MISSING_VALUE} means no reading, not zero
        </p>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            Previous
          </Button>

          <span className="font-mono text-xs text-fg-muted">
            Page {pageIndex + 1} of {Math.max(1, table.getPageCount())}
          </span>

          <Button
            variant="outline"
            size="sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}
