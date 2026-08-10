"use client";

import type { EChartsOption } from "echarts";
import ReactECharts from "echarts-for-react";
import { useMemo } from "react";
import { PRICE_UNIT } from "@/shared/config";
import { formatPrice } from "@/shared/lib/format-number";
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
 * Every hour in the range sorted from most to least expensive.
 *
 * Reads as "how many hours were above this price" — the left shoulder is the volatility
 * story a chronological chart hides. `dataZoom` because that shoulder is the top few
 * percent, unreadable at 720 points across one axis.
 */
export function DurationCurveChart({ curve }: { curve: DurationCurve }) {
  const tokens = useChartTokens(TOKENS);

  const option = useMemo<EChartsOption | null>(() => {
    if (tokens === null) return null;

    return {
      animation: false,
      // Room for the axis name above the axis; at 16 the unit was clipped by the card.
      grid: { top: 36, right: 16, bottom: 56, left: 16, containLabel: true },

      tooltip: {
        trigger: "axis",
        axisPointer: { type: "line", lineStyle: { color: tokens["--chart-crosshair"] } },
        backgroundColor: tokens["--chart-tooltip-surface"],
        borderWidth: 0,
        textStyle: { color: tokens["--chart-tooltip-fg"] },
        /* A sentence: "25% · 1,024" reads as a price *at* 25 % of something. */
        formatter: (params: unknown) => {
          const point = Array.isArray(params) ? params[0] : params;
          const { axisValue, data } = point as { axisValue: string; data: number };

          return `${axisValue} of hours cost ${formatPrice(data)} ${PRICE_UNIT} or more`;
        },
      },

      xAxis: {
        type: "category",
        // Whole percents; the raw index would mean nothing to a reader.
        data: curve.percentiles.map((value) => `${value.toFixed(0)}%`),
        // The sentence has to finish. "Share of hours at or above" left the reader to
        // guess above *what*, which is the whole trick of a duration curve.
        name: "Share of hours at or above this price",
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

          /*
           * A sorted curve has no landmarks — no dates, no peaks in time — so nothing to
           * judge high or low against until one is drawn.
           */
          markLine: {
            silent: true,
            symbol: "none",
            lineStyle: {
              color: tokens["--chart-crosshair"],
              type: "dashed",
              width: 1,
            },
            label: {
              formatter: `Median ${formatPrice(curve.median)}`,
              position: "insideEndTop",
              color: tokens["--chart-axis"],
              fontSize: 11,
            },
            data: [{ yAxis: curve.median }],
          },
        },
      ],
    };
  }, [tokens, curve]);

  if (option === null) {
    return <div className="h-full min-h-[var(--chart-min-height)]" aria-hidden="true" />;
  }

  return (
    <ReactECharts
      opts={{ renderer: "canvas" }}
      // Fills the card. The slot in `view-card.tsx` carries the minimum.
      style={{ height: "100%", width: "100%" }}
      notMerge
      option={option}
    />
  );
}
