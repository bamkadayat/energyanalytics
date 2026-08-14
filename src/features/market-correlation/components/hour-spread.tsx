"use client";

import type { BoxplotSeriesOption, EChartsOption } from "echarts";
import ReactECharts from "echarts-for-react";
import { useMemo } from "react";
import { PRICE_UNIT } from "@/shared/config";
import { formatPrice } from "@/shared/lib/format-number";
import type { HourSpread } from "../utils/derive-hour-spread";
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
 * Every hour of the day as twenty-four boxes. Position over colour intensity — a fixed
 * colour scale collapses once this market's regular near-zero hours stretch it.
 *
 * It cannot say which *day* an extreme fell on; that is the table's question.
 */
export function HourSpreadChart({ spread }: { spread: HourSpread }) {
  const tokens = useChartTokens(TOKENS);

  const option = useMemo<EChartsOption | null>(() => {
    if (tokens === null) return null;

    return {
      animation: false,
      // Room for the axis name, which sits *above* the axis. Below ~32 it is clipped
      // by the top of the card — the same trap the hourly chart hit.
      grid: { top: 36, right: 16, bottom: 44, left: 16, containLabel: true },

      tooltip: {
        trigger: "item",
        backgroundColor: tokens["--chart-tooltip-surface"],
        borderWidth: 0,
        textStyle: { color: tokens["--chart-tooltip-fg"] },
        // Named figures, not ECharts' five bare numbers.
        formatter: (params: unknown) => {
          const point = params as { dataIndex: number; value: number[] };
          const [, min, q1, median, q3, max] = point.value;
          const label = spread.hourLabels[point.dataIndex];
          const days = spread.counts[point.dataIndex];

          return [
            `<strong>${label}:00</strong> · ${days} day${days === 1 ? "" : "s"}`,
            `Median ${formatPrice(median)} ${PRICE_UNIT}`,
            `Middle half ${formatPrice(q1)}–${formatPrice(q3)}`,
            `Range ${formatPrice(min)}–${formatPrice(max)}`,
          ].join("<br>");
        },
      },

      xAxis: {
        type: "category",
        data: spread.hourLabels,
        name: "Hour of day, Europe/Oslo",
        nameLocation: "middle",
        nameGap: 28,
        nameTextStyle: { color: tokens["--chart-axis"] },
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

      series: [
        {
          type: "boxplot",
          // A gap stays a gap: an hour the range never priced draws nothing.
          data: spread.boxes.map((box) => box ?? null) as BoxplotSeriesOption["data"],
          /*
           * 1px at rest, matching the line charts (2026-08-14). With the shared fill now
           * at 6% the box is outline-led rather than a filled block — which is the point,
           * and the median still reads because the border is navy-800 on white.
           */
          itemStyle: {
            color: tokens["--chart-price-fill"],
            borderColor: tokens["--chart-price"],
            borderWidth: 1,
          },
          /*
           * Hover still steps up, just from a thinner base. It has to stay a *visible*
           * step: the emphasis border is the only feedback that a box is the one being
           * read, since the tooltip sits away from it.
           */
          emphasis: {
            itemStyle: { borderColor: tokens["--chart-price"], borderWidth: 2 },
          },
          boxWidth: [8, 40] as [number, number],
        },
      ],
    };
  }, [tokens, spread]);

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
