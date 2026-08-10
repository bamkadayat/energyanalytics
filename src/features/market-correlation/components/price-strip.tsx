import type { AlignedHours } from "../types";

/**
 * The whole day as one bar per hour, under the current price.
 *
 * It answers "is this hour cheap?" in the only way a single number cannot — by showing
 * what it is cheap *relative to*. Three hours are picked out: the one you are in, the
 * day's cheapest and the day's priciest. Each of those is also stated as text in a card
 * beside the strip, so nothing here is the only route to a fact.
 *
 * `aria-hidden`, deliberately. Twenty-four bars announced one by one is noise, and every
 * figure it shows is already in the cards above it and the hourly table below. This is
 * the chart-is-never-the-only-way rule from ui-rules.md applied to a sparkline.
 */
export function PriceStrip({
  aligned,
  currentIndex,
  cheapestIndex,
  priciestIndex,
}: {
  aligned: AlignedHours;
  currentIndex: number;
  cheapestIndex: number;
  priciestIndex: number;
}) {
  const prices = aligned.nokPerKwh;
  const present = prices.filter((price): price is number => price !== null);

  if (present.length === 0) {
    return null;
  }

  /*
   * Scaled from zero rather than from the day's minimum. A price floor of "the cheapest
   * hour" would redraw a flat day as a dramatic one — the bars must be readable as
   * amounts, not as ranks.
   */
  const max = Math.max(...present);

  return (
    <div aria-hidden="true" className="flex h-14 items-end gap-[2px]">
      {prices.map((price, index) => (
        <span
          key={aligned.hours[index].getTime()}
          className={`min-w-0 flex-1 rounded-[2px] ${toneOf(index, {
            currentIndex,
            cheapestIndex,
            priciestIndex,
          })}`}
          style={{
            // A gap gets a sliver rather than nothing, so a missing hour still occupies
            // its place in the day instead of the bars silently closing ranks.
            height: price === null ? "2px" : `${Math.max(6, (price / max) * 100)}%`,
          }}
        />
      ))}
    </div>
  );
}

function toneOf(
  index: number,
  marks: { currentIndex: number; cheapestIndex: number; priciestIndex: number },
): string {
  // The current hour wins a tie: "where am I" is the question the strip is under.
  if (index === marks.currentIndex) {
    return "bg-price-now";
  }
  if (index === marks.cheapestIndex) {
    return "bg-price-low";
  }
  if (index === marks.priciestIndex) {
    return "bg-price-high";
  }

  return "bg-price-bar";
}
