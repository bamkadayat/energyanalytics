import type { AlignedHours } from "../types";

/**
 * Geometry for the landing page's preview chart, computed on the server.
 *
 * The preview is **inline SVG, not ECharts**: it is a static picture on a marketing page,
 * so shipping a charting library for it would cost the landing page its whole point.
 * Everything here is pure maths over data the server already has.
 *
 * Each series is scaled to its **own** min and max, exactly as the real chart's dual axes
 * are. The two lines are therefore comparable in shape only — never in height — which is
 * the same caveat the dashboard makes explicit.
 */

export interface PreviewChart {
  width: number;
  height: number;
  /** Path for the price line, and the same path closed into an area. */
  priceLine: string;
  priceArea: string;
  /** Path for the weather metric. Empty when the metric has no readings. */
  metricLine: string;
  /** The metric path closed into an area, for consumers that fill under it. */
  metricArea: string;
  /** Inner bounds of the plot. Consumers drawing their own geometry must respect these. */
  plotLeft: number;
  plotRight: number;
  ticks: Array<{ x: number; label: string }>;
  highlight: {
    x: number;
    priceY: number | null;
    metricY: number | null;
    hourLabel: string;
    price: number | null;
    metricValue: number | null;
  } | null;
}

const WIDTH = 600;
const HEIGHT = 200;
const PAD_TOP = 12;
const PAD_BOTTOM = 18;

/**
 * Horizontal inset, so the first and last hour are not drawn on the viewBox edge.
 *
 * Without it the midnight tick sat at `x=0` with `text-anchor: middle`, and half the
 * glyph fell outside the viewBox — "00" rendered as "0". The curves ran into both edges
 * the same way, which read as a chart that had been cropped rather than drawn.
 */
const PAD_X = 12;

export function toPreviewChart(
  aligned: AlignedHours,
  hourLabels: string[],
  highlightIndex: number,
): PreviewChart {
  const count = aligned.hours.length;

  if (count === 0) {
    return {
      width: WIDTH,
      height: HEIGHT,
      priceLine: "",
      priceArea: "",
      metricLine: "",
      metricArea: "",
      plotLeft: PAD_X,
      plotRight: WIDTH - PAD_X,
      ticks: [],
      highlight: null,
    };
  }

  const xAt = (index: number) =>
    PAD_X + (index / Math.max(1, count - 1)) * (WIDTH - PAD_X * 2);
  const priceY = scaler(aligned.nokPerKwh);
  const metricY = scaler(aligned.metricValues);

  const ticks = hourLabels
    .map((label, index) => ({ x: xAt(index), label }))
    // Every third hour; 24 labels at this width collide.
    .filter((_, index) => index % 3 === 0);

  const priceLine = smoothPath(aligned.nokPerKwh, xAt, priceY);
  const metricLine = smoothPath(aligned.metricValues, xAt, metricY);

  /** Closes a line back along the baseline, within the plot rather than the viewBox. */
  const toArea = (line: string) =>
    line === "" ? "" : `${line} L${WIDTH - PAD_X},${HEIGHT} L${PAD_X},${HEIGHT} Z`;

  return {
    width: WIDTH,
    height: HEIGHT,
    priceLine,
    priceArea: toArea(priceLine),
    metricLine,
    metricArea: toArea(metricLine),
    plotLeft: PAD_X,
    plotRight: WIDTH - PAD_X,
    ticks,
    highlight:
      highlightIndex < 0 || highlightIndex >= count
        ? null
        : {
            x: xAt(highlightIndex),
            priceY: priceY(aligned.nokPerKwh[highlightIndex] ?? null),
            metricY: metricY(aligned.metricValues[highlightIndex] ?? null),
            hourLabel: hourLabels[highlightIndex] ?? "",
            price: aligned.nokPerKwh[highlightIndex] ?? null,
            metricValue: aligned.metricValues[highlightIndex] ?? null,
          },
  };
}

/**
 * Maps a series to y pixels against its own range, inverted because SVG y grows downward.
 *
 * A flat series would divide by zero, so it is pinned to the middle instead of collapsing
 * onto an edge.
 */
function scaler(values: ReadonlyArray<number | null>) {
  const present = values.filter((v): v is number => v !== null && v !== undefined);
  const min = Math.min(...present);
  const max = Math.max(...present);
  const span = max - min;
  const usable = HEIGHT - PAD_TOP - PAD_BOTTOM;

  return (value: number | null): number | null => {
    if (value === null || value === undefined || present.length === 0) {
      return null;
    }
    if (span === 0) {
      return PAD_TOP + usable / 2;
    }
    return PAD_TOP + usable - ((value - min) / span) * usable;
  };
}

/**
 * A path smoothed through midpoints with quadratic curves — enough to look drawn rather
 * than plotted, without inventing values between the hours.
 *
 * A gap starts a new subpath rather than being bridged. Connecting across a missing hour
 * would draw data that does not exist, which is the one thing this product must not do
 * even in a decorative chart.
 */
function smoothPath(
  values: ReadonlyArray<number | null>,
  xAt: (index: number) => number,
  yAt: (value: number | null) => number | null,
): string {
  const segments: string[] = [];
  let current: Array<{ x: number; y: number }> = [];

  const flush = () => {
    if (current.length === 0) return;
    if (current.length === 1) {
      // A lone point has nothing to curve to; a dot keeps it visible.
      const { x, y } = current[0];
      segments.push(`M${round(x)},${round(y)} L${round(x + 0.01)},${round(y)}`);
      current = [];
      return;
    }

    let path = `M${round(current[0].x)},${round(current[0].y)}`;
    for (let i = 1; i < current.length; i += 1) {
      const previous = current[i - 1];
      const point = current[i];
      const midX = (previous.x + point.x) / 2;
      path += ` Q${round(previous.x)},${round(previous.y)} ${round(midX)},${round((previous.y + point.y) / 2)}`;
    }
    const last = current[current.length - 1];
    path += ` T${round(last.x)},${round(last.y)}`;

    segments.push(path);
    current = [];
  };

  values.forEach((value, index) => {
    const y = yAt(value ?? null);
    if (y === null) {
      flush();
      return;
    }
    current.push({ x: xAt(index), y });
  });
  flush();

  return segments.join(" ");
}

/** Two decimals keeps the emitted path readable and the HTML smaller. */
function round(value: number): number {
  return Math.round(value * 100) / 100;
}

export interface MetricPreviewStats {
  min: number | null;
  max: number | null;
  peakHourLabel: string | null;
  missing: number;
  total: number;
}

/**
 * The one-line summary under each metric card.
 *
 * Reports missing hours rather than hiding them: a card claiming "24 of 24 hours" when
 * one reading was absent would be the small dishonesty this product exists to avoid.
 */
export function summariseMetric(
  aligned: AlignedHours,
  hourLabels: string[],
): MetricPreviewStats {
  const values = aligned.metricValues;
  const present = values
    .map((value, index) => ({ value, index }))
    .filter((entry): entry is { value: number; index: number } => entry.value !== null);

  if (present.length === 0) {
    return {
      min: null,
      max: null,
      peakHourLabel: null,
      missing: values.length,
      total: values.length,
    };
  }

  // First occurrence wins on a tie, so the answer is stable rather than flipping.
  const peak = present.reduce((best, entry) => (entry.value > best.value ? entry : best));

  return {
    min: Math.min(...present.map((entry) => entry.value)),
    max: Math.max(...present.map((entry) => entry.value)),
    peakHourLabel: hourLabels[peak.index] ?? null,
    missing: values.length - present.length,
    total: values.length,
  };
}
