import Link from "next/link";
import { WEATHER_METRICS, WEATHER_METRIC_IDS, type DaySelection } from "@/shared/config";
import { hrefWith, type ViewParams } from "../utils/view-params";

const DAY_OPTIONS: ReadonlyArray<{ value: DaySelection; label: string }> = [
  { value: "today", label: "Today" },
  { value: "tomorrow", label: "Tomorrow" },
];

/**
 * Day and metric selectors.
 *
 * Plain links, not buttons with client state. The selection *is* the URL, so navigating
 * is the whole interaction — which means these work before any JavaScript loads, keep
 * the back button meaningful, and need no `"use client"` boundary.
 */
export function ViewControls({ params }: { params: ViewParams }) {
  return (
    <div className="flex flex-wrap gap-x-8 gap-y-4">
      <SegmentedLinks
        label="Day"
        options={DAY_OPTIONS.map((option) => ({
          key: option.value,
          label: option.label,
          href: hrefWith(params, { day: option.value }),
          selected: params.day === option.value,
        }))}
      />

      <SegmentedLinks
        label="Weather metric"
        options={WEATHER_METRIC_IDS.map((id) => ({
          key: id,
          label: WEATHER_METRICS[id].label,
          href: hrefWith(params, { metric: id }),
          selected: params.metric === id,
        }))}
      />
    </div>
  );
}

interface SegmentOption {
  key: string;
  label: string;
  href: string;
  selected: boolean;
}

function SegmentedLinks({
  label,
  options,
}: {
  label: string;
  options: SegmentOption[];
}) {
  return (
    <nav aria-label={label} className="flex flex-col gap-2">
      <span className="font-mono text-xs uppercase tracking-wider text-fg-muted">
        {label}
      </span>

      <ul className="flex flex-wrap gap-1 rounded-pill border border-line bg-surface p-1">
        {options.map((option) => (
          <li key={option.key}>
            <Link
              href={option.href}
              /*
               * aria-current is what tells a screen reader which option is active. The
               * visual treatment adds background and border on top, so selection is
               * never carried by colour alone.
               */
              aria-current={option.selected ? "page" : undefined}
              className={
                option.selected
                  ? "block rounded-pill border border-line-selected bg-surface-selected px-4 py-1.5 text-sm font-medium text-on-action-secondary"
                  : // Same border width as the selected state, in the container's own
                    // colour, so selecting an option cannot shift the layout.
                    "block rounded-pill border border-surface px-4 py-1.5 text-sm text-fg-secondary hover:bg-surface-subtle"
              }
            >
              {option.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
