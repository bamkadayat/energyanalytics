import { PRICE_UNIT } from "@/shared/config";
import { formatPrice, MISSING_VALUE } from "@/shared/lib/format-number";
import type { HourSpread } from "../utils/derive-hour-spread";
import type { DurationCurve } from "../utils/derive-range-views";

/**
 * Tabular forms of the range views. The spread's adds the day count, since three days and
 * thirty draw the same box. The curve's is deciles, not its 720 rows, which answer nothing.
 */

export function HourSpreadTable({ spread }: { spread: HourSpread }) {
  return (
    <div className="max-h-[26rem] overflow-auto rounded-control border border-line">
      <table className="w-full border-collapse text-sm">
        <caption className="sr-only">
          Spot price in {PRICE_UNIT} by hour of day across the range, in Europe/Oslo time.
          The middle half is the range the two central quartiles cover.
        </caption>

        <thead>
          <tr className="border-b border-line text-left">
            {/* Sticky, because 24 rows outrun the box the table sits in. */}
            <th
              scope="col"
              className="sticky top-0 z-10 bg-surface px-3 py-2 font-medium text-fg-muted"
            >
              Hour
            </th>
            {["Median", "Middle half", "Lowest", "Highest", "Days"].map((heading) => (
              <th
                key={heading}
                scope="col"
                className="sticky top-0 z-10 bg-surface px-3 py-2 text-right font-medium text-fg-muted"
              >
                {heading}
              </th>
            ))}
          </tr>
        </thead>

        <tbody>
          {spread.hourLabels.map((hour, index) => {
            const box = spread.boxes[index];

            return (
              <tr key={hour} className="border-b border-line last:border-0">
                <th
                  scope="row"
                  className="px-3 py-1.5 text-left font-mono font-normal text-fg-secondary"
                >
                  {hour}:00
                </th>

                {box === null ? (
                  <td className="px-3 py-1.5 text-right text-fg-muted" colSpan={5}>
                    {MISSING_VALUE} no priced hour at this time in the range
                  </td>
                ) : (
                  <>
                    <Cell>{formatPrice(box[2])}</Cell>
                    <Cell>
                      {formatPrice(box[1])}–{formatPrice(box[3])}
                    </Cell>
                    <Cell>{formatPrice(box[0])}</Cell>
                    <Cell>{formatPrice(box[4])}</Cell>
                    <Cell>{spread.counts[index]}</Cell>
                  </>
                )}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function Cell({ children }: { children: React.ReactNode }) {
  return (
    <td className="px-3 py-1.5 text-right font-mono tabular-nums text-fg">{children}</td>
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
              Price at or above ({PRICE_UNIT})
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
