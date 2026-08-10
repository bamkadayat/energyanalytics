"use client";

import type { EChartsOption } from "echarts";
import ReactECharts from "echarts-for-react";
import { useMemo } from "react";
import { PRICE_UNIT } from "@/shared/config";
import type { PriceHeatmap } from "../utils/derive-range-views";
import { useChartTokens } from "./use-chart-tokens";

const TOKENS = [
  "--heat-0",
  "--heat-1",
  "--heat-2",
  "--heat-3",
  "--heat-4",
  "--heat-5",
  "--chart-axis",
  "--chart-grid",
  "--chart-tooltip-surface",
  "--chart-tooltip-fg",
] as const;

/**
 * Price by hour of day across the range: 24 rows, one column per day.
 *
 * This is the view that makes the daily and weekly shape obvious — the morning and
 * evening bands, and the weekend contrast — which a chronological line buries in 720
 * points of zig-zag.
 *
 * The cells arrive pre-built from the server as `[day, hour, price]` triples, so the
 * browser does no bucketing. Options are memoised because the array is ~720 entries and
 * rebuilding it on unrelated re-renders is pure waste.
 */
export function PriceHeatmapChart({ heatmap }: { heatmap: PriceHeatmap }) {
  const tokens = useChartTokens(TOKENS);

  const option = useMemo<EChartsOption | null>(() => {
    if (tokens === null) return null;

    return {
      animation: false,
      grid: { top: 12, right: 16, bottom: 64, left: 16, containLabel: true },

      tooltip: {
        backgroundColor: tokens["--chart-tooltip-surface"],
        borderWidth: 0,
        textStyle: { color: tokens["--chart-tooltip-fg"] },
        formatter: (params: unknown) => {
          const { data } = params as { data: [number, number, number] };
          const [day, hour, price] = data;
          return `${heatmap.dayLabels[day]} · ${heatmap.hourLabels[hour]}<br/>${price.toFixed(
            3,
          )} ${PRICE_UNIT}`;
        },
      },

      xAxis: {
        type: "category",
        data: heatmap.dayLabels,
        axisLabel: { color: tokens["--chart-axis"], fontSize: 11, hideOverlap: true },
        axisLine: { lineStyle: { color: tokens["--chart-grid"] } },
        axisTick: { show: false },
        splitArea: { show: false },
      },

      yAxis: {
        type: "category",
        data: heatmap.hourLabels,
        name: "Hour",
        nameTextStyle: { color: tokens["--chart-axis"] },
        // Every third hour: 24 labels at this height collide.
        axisLabel: {
          color: tokens["--chart-axis"],
          fontSize: 11,
          interval: 2,
        },
        axisLine: { lineStyle: { color: tokens["--chart-grid"] } },
        axisTick: { show: false },
        splitArea: { show: false },
      },

      visualMap: {
        min: heatmap.min,
        max: heatmap.max,
        calculable: true,
        orient: "horizontal",
        left: "center",
        bottom: 0,
        textStyle: { color: tokens["--chart-axis"] },
        // Ordered by lightness, so the scale still reads in greyscale.
        inRange: {
          color: [
            tokens["--heat-0"],
            tokens["--heat-1"],
            tokens["--heat-2"],
            tokens["--heat-3"],
            tokens["--heat-4"],
            tokens["--heat-5"],
          ],
        },
      },

      series: [
        {
          type: "heatmap",
          data: heatmap.cells,
          // No per-cell labels: 720 of them would be unreadable and cost a lot to draw.
          label: { show: false },
          progressive: 0,
          itemStyle: { borderWidth: 0 },
          emphasis: { itemStyle: { borderColor: tokens["--chart-tooltip-surface"], borderWidth: 1 } },
        },
      ],
    };
  }, [tokens, heatmap]);

  if (option === null) {
    return <div className="min-h-[var(--chart-min-height)]" aria-hidden="true" />;
  }

  return (
    <ReactECharts
      opts={{ renderer: "canvas" }}
      style={{ height: "var(--chart-heatmap-height)", width: "100%" }}
      notMerge
      option={option}
    />
  );
}
