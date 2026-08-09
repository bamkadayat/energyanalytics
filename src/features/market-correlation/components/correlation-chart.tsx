"use client";

import type { EChartsOption } from "echarts";
import ReactECharts from "echarts-for-react";
import { useMemo } from "react";
import type { ChartSeries } from "../utils/to-chart-series";
import { useChartTokens } from "./use-chart-tokens";

/**
 * The one place in this app that needs the DOM.
 *
 * ECharts draws to a canvas, and canvas cannot read `var(--token)`. Colours are
 * therefore resolved from the stylesheet after mount with `getComputedStyle`, which is
 * also why this cannot be a server component: the values do not exist until a document
 * does.
 *
 * The chart is never the only way to read the data. The text summary above it carries
 * the same numbers, per `ui-rules.md`.
 */
export function CorrelationChart({ series }: { series: ChartSeries }) {
  const palette = useChartPalette(series.metricId);

  // Colours resolve on the first client effect. Until then reserve the space rather than
  // drawing with wrong colours and repainting.
  if (palette === null) {
    return <div className="min-h-[var(--chart-min-height)]" aria-hidden="true" />;
  }

  return (
    <ReactECharts
      // Canvas outperforms SVG for a redraw-on-hover crosshair, and is the documented
      // default choice for this project.
      opts={{ renderer: "canvas" }}
      style={{ height: "var(--chart-min-height)", width: "100%" }}
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
    grid: { top: 48, right: 16, bottom: 32, left: 16, containLabel: true },

    legend: {
      top: 0,
      left: 0,
      textStyle: { color: palette.axis },
      // Icons mirror the line styles, so the legend teaches the solid/dashed distinction
      // rather than leaving colour to carry it.
      data: [
        { name: series.priceUnit, icon: "roundRect" },
        { name: metricSeriesName, icon: "rect" },
      ],
    },

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
     * A category axis over pre-formatted Oslo labels, not a time axis. A time axis
     * formats ticks in the viewer's own timezone, which would silently relabel Norwegian
     * market hours for anyone reading from another country.
     */
    xAxis: {
      type: "category",
      data: series.hourLabels,
      boundaryGap: false,
      axisLabel: { ...axisLabel, hideOverlap: true },
      axisLine,
      axisTick: { show: false },
    },

    /*
     * Two independent scales. Each axis is named with its unit and tinted to match its
     * series, so the pairing is unambiguous — dual axes must never imply the two lines
     * are directly comparable.
     */
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
