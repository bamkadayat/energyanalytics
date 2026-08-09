"use client";

import type { EChartsOption } from "echarts";
import ReactECharts from "echarts-for-react";
import { useMemo } from "react";
import { PRICE_UNIT } from "@/shared/config";
import type { DurationCurve } from "../utils/derive-range-views";
import { useChartTokens } from "./use-chart-tokens";

const TOKENS = [
  "--chart-price",
  "--chart-price-fill",
  "--chart-axis",
  "--chart-grid",
  "--chart-crosshair",
  "--chart-tooltip-surface",
  "--chart-tooltip-fg",
] as const;

/**
 * The price duration curve: every hour in the range sorted from most to least expensive.
 *
 * Reads as "how many hours were above this price" — the steepness of the left shoulder
 * is the volatility story, which a chronological chart hides. Standard in energy
 * analysis for exactly that reason.
 *
 * `dataZoom` because the interesting part is usually the top few percent, and 720 points
 * compressed into one axis makes that shoulder unreadable without being able to zoom
 * into it.
 */
export function DurationCurveChart({ curve }: { curve: DurationCurve }) {
  const tokens = useChartTokens(TOKENS);

  const option = useMemo<EChartsOption | null>(() => {
    if (tokens === null) return null;

    return {
      animation: false,
      grid: { top: 16, right: 16, bottom: 56, left: 16, containLabel: true },

      tooltip: {
        trigger: "axis",
        axisPointer: { type: "line", lineStyle: { color: tokens["--chart-crosshair"] } },
        backgroundColor: tokens["--chart-tooltip-surface"],
        borderWidth: 0,
        textStyle: { color: tokens["--chart-tooltip-fg"] },
      },

      xAxis: {
        type: "category",
        // Whole percents; the raw index would mean nothing to a reader.
        data: curve.percentiles.map((value) => `${value.toFixed(0)}%`),
        name: "Share of hours at or above",
        nameLocation: "middle",
        nameGap: 28,
        nameTextStyle: { color: tokens["--chart-axis"] },
        boundaryGap: false,
        axisLabel: { color: tokens["--chart-axis"], fontSize: 11, hideOverlap: true },
        axisLine: { lineStyle: { color: tokens["--chart-grid"] } },
        axisTick: { show: false },
      },

      yAxis: {
        type: "value",
        name: PRICE_UNIT,
        nameTextStyle: { color: tokens["--chart-price"] },
        axisLabel: { color: tokens["--chart-axis"], fontSize: 12 },
        splitLine: { lineStyle: { color: tokens["--chart-grid"] } },
      },

      dataZoom: [
        { type: "inside", throttle: 50 },
        {
          type: "slider",
          height: 18,
          bottom: 4,
          borderColor: tokens["--chart-grid"],
          fillerColor: tokens["--chart-price-fill"],
          handleStyle: { color: tokens["--chart-price"] },
          textStyle: { color: tokens["--chart-axis"] },
        },
      ],

      series: [
        {
          name: PRICE_UNIT,
          type: "line",
          data: curve.prices,
          showSymbol: false,
          // 720 points: sampling keeps the draw cheap without changing the shape.
          sampling: "lttb",
          lineStyle: { color: tokens["--chart-price"], width: 2 },
          itemStyle: { color: tokens["--chart-price"] },
          areaStyle: { color: tokens["--chart-price-fill"] },
        },
      ],
    };
  }, [tokens, curve]);

  if (option === null) {
    return <div className="min-h-[var(--chart-min-height)]" aria-hidden="true" />;
  }

  return (
    <ReactECharts
      opts={{ renderer: "canvas" }}
      style={{ height: "22rem", width: "100%" }}
      notMerge
      option={option}
    />
  );
}
