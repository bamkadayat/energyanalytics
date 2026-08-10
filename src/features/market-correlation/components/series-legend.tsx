/**
 * The chart's key, in the DOM rather than on the canvas.
 *
 * ECharts can draw its own legend, but a canvas legend is unselectable, invisible to
 * assistive technology, and clipped by the plot area on a narrow screen. Here it is text,
 * it sits in the card header where the eye lands first, and it survives the chart failing
 * to mount at all.
 *
 * Each swatch is a **line sample, not a dot**: solid for the price, dashed for the metric.
 * That distinction is the one ui-tokens.md calls load-bearing — the four series colours
 * sit at near-identical luminance and separate by hue alone, so anyone who cannot use hue
 * reads the chart by line style. A round swatch would teach the wrong key.
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
