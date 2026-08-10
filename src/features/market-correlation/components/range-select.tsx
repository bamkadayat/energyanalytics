"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { RANGE_DAY_OPTIONS, type RangeDays } from "@/shared/config";
import { hrefWith, type ViewParams } from "../utils/view-params";

/**
 * Range-length dropdown for the 30-day views.
 *
 * A **native `<select>`**, styled with tokens, rather than a custom listbox. A bespoke
 * dropdown means re-implementing roving focus, type-ahead, `aria-activedescendant` and
 * the mobile picker — and getting one of them wrong is worse than the stock control
 * looking slightly less bespoke.
 *
 * Unlike the chart/table toggles, this one *does* navigate: a different range is
 * different data, which only the server can fetch. `replace` with `scroll: false` keeps
 * the position, and `useTransition` keeps the old numbers on screen — dimmed — while the
 * new ones load, instead of collapsing the section into a skeleton.
 */
export function RangeSelect({ params }: { params: ViewParams }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <div className="flex items-center gap-2">
      <label htmlFor="range-days" className="font-mono text-xs uppercase tracking-wider text-fg-muted">
        Range
      </label>

      <select
        id="range-days"
        value={params.range}
        disabled={pending}
        onChange={(event) => {
          const next = Number(event.target.value) as RangeDays;
          startTransition(() => {
            router.replace(hrefWith(params, { range: next }), { scroll: false });
          });
        }}
        className="rounded-control border border-line bg-surface px-3 py-1.5 text-sm text-fg disabled:text-fg-muted"
      >
        {RANGE_DAY_OPTIONS.map((days) => (
          <option key={days} value={days}>
            {days} days
          </option>
        ))}
      </select>

      {/* Announced politely, so a screen reader learns the section is reloading. */}
      <span role="status" className="sr-only">
        {pending ? "Loading the new range" : ""}
      </span>
    </div>
  );
}
