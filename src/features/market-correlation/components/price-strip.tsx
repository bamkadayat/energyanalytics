import type { AlignedHours } from "../types";

/**
 * The whole day as one bar per hour, under the current price.
 *
 * It answers "is this hour cheap?" in the only way a single number cannot — by showing
 * what it is cheap *relative to*.
 *
 * **One mark, not three.** The strip used to fill the cheapest bar green and the priciest
 * red, which put the two loudest colours on the page inside a sparkline the width of a
 * paragraph — and told the reader nothing the bars did not: the cheapest hour is the
 * shortest bar and the priciest is the tallest, by construction. Both are also stated as
 * text in the cards beside it. What height cannot show is *where you are*, so that is the
 * one hour that gets a fill.
 *
 * `aria-hidden`, deliberately. Twenty-four bars announced one by one is noise, and every
 * figure it shows is already in the cards above it and the hourly table below. This is
 * the chart-is-never-the-only-way rule from ui-rules.md applied to a sparkline.
 */
export function PriceStrip({
  aligned,
  currentIndex,
}: {
  aligned: AlignedHours;
  currentIndex: number;
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
          className={`min-w-0 flex-1 rounded-[2px] ${
            index === currentIndex ? "bg-price-now" : "bg-price-bar"
          }`}
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
