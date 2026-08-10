"use client";
/*
 * Same reason as `hourly-data-table.tsx`: React Compiler cannot safely memoize what
 * `useReactTable` returns, and the directive has to sit in the file prologue.
 */
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
 * Height assumed for the *first* render only.
 *
 * The real height is `--table-height`, a viewport-relative clamp, so it depends on the
 * device and is not knowable on the server. The virtualizer measures the container on
 * mount and corrects itself; this number only decides how many rows the server-rendered
 * markup contains, so a mid-range laptop is the right guess.
 */
const SCROLLER_HEIGHT = 640;

const PAGE_SIZES = [100, 500, 1000] as const;

const columnHelper = createColumnHelper<HourRecord>();

/**
 * Reads a numeric column, turning a gap into `undefined`.
 *
 * The rows carry `null` for a missing reading, but TanStack's `sortUndefined` recognises
 * **only** `undefined` — it compares `value === undefined` and nothing else. Declared
 * against `null` it silently did nothing, and the gap fell through to the default
 * comparator, where `null` behaves as zero: a missing temperature sorted between -8 °C
 * and 4 °C, and a missing price sorted above a negative one. This footer says
 * "— means no reading, not zero"; handing TanStack the value it actually looks for is
 * what makes that true of the sort as well as the cell.
 *
 * `sortUndefined: "last"` returns before the descending inversion is applied, so gaps
 * stay at the end whichever way the column is pointed — which is what a reader means by
 * "show me the coldest hours" either way.
 */
function present(value: number | null): number | undefined {
  return value ?? undefined;
}

/**
 * Every hour of the selected span, as one scrollable table.
 *
 * The dashboard's other table shows 24 rows and can render all of them. This one is the
 * same data at range scale — a few thousand hours — where three things stop being free:
 *
 * 1. **Rendering.** Only the visible window exists in the DOM, via `useVirtualizer`.
 *    Roughly 25 rows are mounted at any scroll position instead of 2,000, so the browser
 *    lays out a screenful rather than a document.
 * 2. **Sorting and filtering.** Both run over the *whole* set in TanStack's row models,
 *    then the virtualizer draws whatever survives. Sorting a page would answer "the
 *    cheapest of the hundred you happen to be looking at".
 * 3. **Semantics.** Virtualization normally costs a screen-reader user the table: the
 *    rows are not there, and the ones that are lie about their position. `aria-rowcount`
 *    on the table and `aria-rowindex` on every row restore both — the row that reads as
 *    1 of 2,184 really is the first, whatever the DOM currently holds.
 *
 * The virtualized layout needs `display: grid` on the table elements, which drops their
 * implicit roles in several browsers, so each one carries its role explicitly.
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

  /*
   * Applied before TanStack sees the rows rather than as another column filter: "hours
   * that have a price" is a property of the row, not of a column's value, and doing it
   * here keeps it out of the filter state the columns own.
   */
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
    /*
     * The size to assume before the container has been measured. The virtualizer sizes
     * the scroll element with `offsetHeight`, which is 0 until the browser has laid the
     * page out — without a rect to fall back on, the first render decides the viewport
     * is zero pixels tall and draws nothing.
     */
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

      {/*
        The scroll container is focusable, because with the rows virtualized the keyboard
        has nothing inside to tab to — without `tabIndex` there would be no way to scroll
        the table without a pointer.
      */}
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

          {/*
            The tbody is as tall as every row on the page would be, and each drawn row is
            positioned into it. That is what keeps the scrollbar honest: it describes the
            whole page, not the handful of rows currently mounted.
          */}
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
