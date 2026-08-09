import { FiChevronRight } from "react-icons/fi";
import { PRICE_UNIT, WEATHER_METRICS } from "@/shared/config";
import { formatMetricValue, formatPrice, MISSING_VALUE } from "@/shared/lib/format-number";
import { formatOsloDate, formatOsloTime } from "@/shared/lib/format-oslo";
import type { OsloDay } from "@/shared/lib/oslo-day";
import type { AlignedHours } from "../types";

/**
 * The accessible alternative to the chart, and a requirement rather than an extra.
 *
 * ECharts draws to a canvas, which is opaque to assistive technology: without this table
 * the numbers would be unreachable for a screen-reader user. `ui-rules.md` states the
 * chart is never the only way to read the data, and this is what makes that true.
 *
 * Built on `<details>`/`<summary>`, so the disclosure is keyboard operable and works with
 * no JavaScript at all — no client component, no state.
 */
export function HourlyTable({
  aligned,
  day,
}: {
  aligned: AlignedHours;
  day: OsloDay;
}) {
  const metric = WEATHER_METRICS[aligned.metricId];

  if (aligned.hours.length === 0) {
    return null;
  }

  return (
    <details className="group rounded-card border border-line bg-surface">
      <summary className="flex cursor-pointer items-center gap-2 p-4 text-sm font-medium text-fg">
        {/* Rotates to point down when open; aria-hidden since the summary text and the
            element's own expanded state already convey it. */}
        <FiChevronRight
          aria-hidden="true"
          className="size-4 shrink-0 transition-transform group-open:rotate-90"
        />
        Show all {aligned.hours.length} hours as a table
      </summary>

      <div className="overflow-x-auto border-t border-line">
        <table className="w-full border-collapse text-sm">
          <caption className="px-4 py-3 text-left text-xs text-fg-muted">
            Hourly spot price and {metric.label.toLowerCase()} for{" "}
            {formatOsloDate(day)}, in {"Europe/Oslo"} time. {MISSING_VALUE} marks an hour
            with no reading — not a value of zero.
          </caption>

          <thead>
            <tr className="border-b border-line text-left">
              <Th>Hour</Th>
              <Th numeric>Spot price ({PRICE_UNIT})</Th>
              <Th numeric>
                {metric.label} ({metric.unit})
              </Th>
            </tr>
          </thead>

          <tbody>
            {aligned.hours.map((hour, index) => (
              <tr key={hour.toISOString()} className="border-b border-line last:border-0">
                {/* row header, so a screen reader announces the hour with each cell */}
                <th scope="row" className="px-4 py-2 text-left font-mono font-normal text-fg-secondary">
                  {formatOsloTime(hour)}
                </th>
                <Td>{formatPrice(aligned.nokPerKwh[index])}</Td>
                <Td>{formatMetricValue(aligned.metricValues[index])}</Td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </details>
  );
}

function Th({ children, numeric = false }: { children: React.ReactNode; numeric?: boolean }) {
  return (
    <th
      scope="col"
      className={`px-4 py-2 font-medium text-fg-muted ${numeric ? "text-right" : ""}`}
    >
      {children}
    </th>
  );
}

function Td({ children }: { children: React.ReactNode }) {
  // Tabular numbers keep the decimal points aligned down the column.
  return (
    <td className="px-4 py-2 text-right font-mono tabular-nums text-fg">{children}</td>
  );
}
