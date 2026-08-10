import Link from "next/link";
import { WEATHER_METRICS, WEATHER_METRIC_IDS, type DaySelection } from "@/shared/config";
import { hrefWith, type ViewParams } from "../utils/view-params";

const DAY_OPTIONS: ReadonlyArray<{ value: DaySelection; label: string }> = [
  { value: "today", label: "Today" },
  { value: "tomorrow", label: "Tomorrow" },
];

/**
 * The dashboard toolbar: day and metric, laid out horizontally.
 *
 * Compact by design. Filters in an analytics tool are used constantly and read rarely,
 * so they belong on one dense row rather than in a block that pushes the data below the
 * fold. Labels sit inline instead of stacked above for the same reason.
 *
 * Plain links, not client state. The selection *is* the URL, so these work before any
 * JavaScript loads and the back button steps through previous views.
 */
export function ViewControls({ params }: { params: ViewParams }) {
  return (
    <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
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
        label="Metric"
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
    <nav aria-label={label} className="flex items-center gap-3">
      <span className="font-mono text-xs uppercase tracking-wider text-fg-muted">
        {label}
      </span>

      <ul className="flex flex-wrap gap-0.5 rounded-pill border border-line bg-page p-0.5">
        {options.map((option) => (
          <li key={option.key}>
            <Link
              href={option.href}
              // A filter, not a destination: keep the scroll position.
              scroll={false}
              // What tells a screen reader which option is active. The visual treatment
              // adds background and border on top, so selection is never colour alone.
              aria-current={option.selected ? "page" : undefined}
              className={
                option.selected
                  ? "block rounded-pill border border-line-selected bg-surface px-3 py-1 text-sm font-medium text-fg shadow-card"
                  : // Same border width in the container's colour, so selecting cannot
                    // shift the layout.
                    "block rounded-pill border border-page px-3 py-1 text-sm text-fg-secondary hover:text-fg"
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
