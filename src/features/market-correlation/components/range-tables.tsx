import { PRICE_UNIT } from "@/shared/config";
import { formatPrice, MISSING_VALUE } from "@/shared/lib/format-number";
import type { DurationCurve, PriceHeatmap } from "../utils/derive-range-views";

/**
 * Tabular forms of the two range views.
 *
 * The heatmap's table is the same grid in text — day rows, hour columns — because that
 * *is* the data. The duration curve's is not: 720 sorted rows would be unreadable and
 * would answer no question anyone actually asks. Deciles answer the question the curve
 * exists for — "how many hours cost at least this much" — in ten lines.
 */

export function HeatmapTable({ heatmap }: { heatmap: PriceHeatmap }) {
  // Rebuild the sparse triples into a lookup so each cell is O(1) rather than a scan.
  const byCell = new Map<string, number>();
  for (const [day, hour, price] of heatmap.cells) {
    byCell.set(`${day}:${hour}`, price);
  }

  return (
    <div className="max-h-[26rem] overflow-auto rounded-control border border-line">
      <table className="w-full border-collapse text-xs">
        <caption className="sr-only">
          Spot price in {PRICE_UNIT} by day and hour of day, in Europe/Oslo time.
        </caption>

        <thead>
          <tr>
            {/* Sticky so the hour headings stay visible while scrolling 30 rows. */}
            <th
              scope="col"
              className="sticky left-0 top-0 z-20 bg-surface px-2 py-2 text-left font-medium text-fg-muted"
            >
              Day
            </th>
            {heatmap.hourLabels.map((hour) => (
              <th
                key={hour}
                scope="col"
                className="sticky top-0 z-10 bg-surface px-2 py-2 text-right font-mono font-medium text-fg-muted"
              >
                {hour}
              </th>
            ))}
          </tr>
        </thead>

        <tbody>
          {heatmap.dayLabels.map((day, dayIndex) => (
            <tr key={day} className="border-t border-line">
              <th
                scope="row"
                className="sticky left-0 bg-surface px-2 py-1.5 text-left font-mono font-normal text-fg-secondary"
              >
                {day}
              </th>
              {heatmap.hourLabels.map((_, hourIndex) => {
                const price = byCell.get(`${dayIndex}:${hourIndex}`);
                return (
                  <td
                    key={hourIndex}
                    className="px-2 py-1.5 text-right font-mono tabular-nums text-fg"
                  >
                    {price === undefined ? MISSING_VALUE : formatPrice(price)}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

const DECILES = [0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100];

export function DurationCurveTable({ curve }: { curve: DurationCurve }) {
  const rows = DECILES.map((percent) => {
    const index = Math.min(
      curve.prices.length - 1,
      Math.max(0, Math.round((percent / 100) * curve.prices.length) - 1),
    );

    return {
      percent,
      price: curve.prices[index],
      hours: Math.max(1, Math.round((percent / 100) * curve.hours)),
    };
  });

  return (
    <div className="overflow-x-auto rounded-control border border-line">
      <table className="w-full border-collapse text-sm">
        <caption className="sr-only">
          Price thresholds by decile across {curve.hours} hours.
        </caption>

        <thead>
          <tr className="border-b border-line text-left">
            <th scope="col" className="px-4 py-2 font-medium text-fg-muted">
              Share of hours
            </th>
            <th scope="col" className="px-4 py-2 text-right font-medium text-fg-muted">
              Hours
            </th>
            <th scope="col" className="px-4 py-2 text-right font-medium text-fg-muted">
              At or above ({PRICE_UNIT})
            </th>
          </tr>
        </thead>

        <tbody>
          {rows.map((row) => (
            <tr key={row.percent} className="border-b border-line last:border-0">
              <th
                scope="row"
                className="px-4 py-2 text-left font-mono font-normal text-fg-secondary"
              >
                Top {row.percent}%
              </th>
              <td className="px-4 py-2 text-right font-mono tabular-nums text-fg-muted">
                {row.hours}
              </td>
              <td className="px-4 py-2 text-right font-mono tabular-nums text-fg">
                {formatPrice(row.price)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
