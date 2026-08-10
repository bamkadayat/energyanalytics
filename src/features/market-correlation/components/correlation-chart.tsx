"use client";

import type { EChartsOption } from "echarts";
import ReactECharts from "echarts-for-react";
import { useMemo } from "react";
import type { ChartSeries } from "../utils/to-chart-series";
import { useChartTokens } from "./use-chart-tokens";

/**
 * The one place in this app that needs the DOM: canvas cannot read `var(--token)`, so
 * colours are resolved after mount. Never the only way to read the data — the summary
 * above carries the same numbers, per `ui-rules.md`.
 *
 * Drawn on paper like every other card. On ink the grid was `--chart-grid-inverse` on
 * `--surface-inverse`: 1.19:1, invisible. The series colours are the same either way.
 */
export function CorrelationChart({ series }: { series: ChartSeries }) {
  const palette = useChartPalette(series.metricId);

  // Colours resolve on the first client effect. Until then reserve the space rather than
  // drawing with wrong colours and repainting.
  if (palette === null) {
    return <div className="h-full min-h-[var(--chart-min-height)]" aria-hidden="true" />;
  }

  return (
    <ReactECharts
      // Canvas outperforms SVG for a redraw-on-hover crosshair, and is the documented
      // default choice for this project.
      opts={{ renderer: "canvas" }}
      // 100% of the slot, which carries the minimum height. See `view-card.tsx`.
      style={{ height: "100%", width: "100%" }}
      notMerge
      option={buildOption(series, palette)}
    />
  );
}

interface ChartPalette {
  price: string;
  priceFill: string;
  metric: string;
  grid: string;
  axis: string;
  crosshair: string;
  tooltipSurface: string;
  tooltipText: string;
}

const TOKENS = [
  "--chart-price",
  "--chart-price-fill",
  "--chart-grid",
  "--chart-axis",
  "--chart-crosshair",
  // Inverted against the panel: on paper the tooltip is the ink, so it reads as a layer
  // above the chart rather than as a white box lost in a white card.
  "--chart-tooltip-surface",
  "--chart-tooltip-fg",
] as const;

/** Reads the palette through the shared hook, plus the series colour for this metric. */
function useChartPalette(metricId: ChartSeries["metricId"]): ChartPalette | null {
  const tokens = useChartTokens([...TOKENS, `--chart-${metricId}`] as const);

  return useMemo(() => {
    if (tokens === null) {
      return null;
    }

    return {
      price: tokens["--chart-price"],
      priceFill: tokens["--chart-price-fill"],
      metric: tokens[`--chart-${metricId}`],
      grid: tokens["--chart-grid"],
      axis: tokens["--chart-axis"],
      crosshair: tokens["--chart-crosshair"],
      tooltipSurface: tokens["--chart-tooltip-surface"],
      tooltipText: tokens["--chart-tooltip-fg"],
    };
  }, [tokens, metricId]);
}

function buildOption(series: ChartSeries, palette: ChartPalette): EChartsOption {
  const axisLabel = { color: palette.axis, fontSize: 12 };
  const axisLine = { lineStyle: { color: palette.grid } };
  const metricSeriesName = `${series.metricLabel} (${series.metricUnit})`;

  return {
    // Nonessential motion is off, which also satisfies prefers-reduced-motion without a
    // media query.
    animation: false,
    // `top` leaves room for the two axis names, which sit above their axes. At 20 the
    // left one was clipped by the edge of the panel.
    grid: { top: 36, right: 16, bottom: 24, left: 16, containLabel: true },

    /* Off: the card header carries the key, in the DOM where it cannot be clipped. */
    legend: { show: false },

    tooltip: {
      trigger: "axis",
      axisPointer: {
        type: "cross",
        label: { backgroundColor: palette.tooltipSurface },
        crossStyle: { color: palette.crosshair },
        lineStyle: { color: palette.crosshair },
      },
      backgroundColor: palette.tooltipSurface,
      borderWidth: 0,
      textStyle: { color: palette.tooltipText },
    },

    /*
     * Category axis over pre-formatted Oslo labels. A time axis formats ticks in the
     * *viewer's* zone, relabelling Norwegian market hours for anyone abroad.
     */
    xAxis: {
      type: "category",
      data: series.hourLabels,
      boundaryGap: false,
      axisLabel: { ...axisLabel, hideOverlap: true },
      axisLine,
      axisTick: { show: false },
    },

    /* Two independent scales, each named and tinted — never imply comparability. */
    yAxis: [
      {
        type: "value",
        name: series.priceUnit,
        nameTextStyle: { color: palette.price },
        position: "left",
        axisLabel,
        splitLine: { lineStyle: { color: palette.grid } },
      },
      {
        type: "value",
        name: series.metricUnit,
        nameTextStyle: { color: palette.metric },
        position: "right",
        axisLabel,
        splitLine: { show: false },
      },
    ],

    series: [
      {
        name: series.priceUnit,
        type: "line",
        yAxisIndex: 0,
        data: series.prices as Array<number | null>,
        showSymbol: false,
        // Solid, with a restrained fill. Together with the dashed metric line below this
        // is what stops the chart depending on colour alone — see ui-tokens.md.
        lineStyle: { color: palette.price, width: 2, type: "solid" },
        itemStyle: { color: palette.price },
        areaStyle: { color: palette.priceFill },
        // Gaps stay gaps. Connecting across them would invent data.
        connectNulls: false,
      },
      {
        name: metricSeriesName,
        type: "line",
        yAxisIndex: 1,
        data: series.metricValues as Array<number | null>,
        showSymbol: false,
        lineStyle: { color: palette.metric, width: 2, type: "dashed" },
        itemStyle: { color: palette.metric },
        connectNulls: false,
      },
    ],
  };
}
