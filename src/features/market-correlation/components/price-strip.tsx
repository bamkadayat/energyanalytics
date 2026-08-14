import type { AlignedHours } from "../types";

/**
 * The whole day as one bar per hour — what the current price is cheap *relative to*.
 * Only the current hour is filled: height already says which is cheapest, but not where
 * you are. `aria-hidden`, since every figure is in the cards and table around it.
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

  // From zero, not from the day's minimum: a floor redraws a flat day as a dramatic one.
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
