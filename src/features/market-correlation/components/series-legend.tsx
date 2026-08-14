/**
 * The chart's key, in the DOM — a canvas legend is unselectable, invisible to assistive
 * tech, and survives nothing. Swatches are line samples, not dots: the chart is two tones
 * of navy, so solid-vs-dashed is the whole distinction and a round swatch would mistaught it.
 */
export function SeriesLegend({
  priceLabel,
  metricLabel,
  metricId,
}: {
  priceLabel: string;
  metricLabel: string;
  metricId: string;
}) {
  return (
    <ul className="flex flex-wrap items-center gap-x-5 gap-y-1">
      <Entry label={priceLabel} color="var(--chart-price)" dashed={false} />
      <Entry label={metricLabel} color={`var(--chart-${metricId})`} dashed />
    </ul>
  );
}

function Entry({
  label,
  color,
  dashed,
}: {
  label: string;
  color: string;
  dashed: boolean;
}) {
  return (
    <li className="flex items-center gap-2 font-mono text-xs text-fg-secondary">
      <span
        aria-hidden="true"
        className="h-0 w-6 shrink-0 border-t-2"
        style={{ borderColor: color, borderTopStyle: dashed ? "dashed" : "solid" }}
      />
      {label}
    </li>
  );
}
