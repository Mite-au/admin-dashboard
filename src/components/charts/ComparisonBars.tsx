'use client';

import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { ChartEmpty } from './ChartEmpty';
import { ChartLegend } from './ChartLegend';
import { ChartTooltip } from './ChartTooltip';
import { axisTick, chartTheme, formatAxisValue, seriesColor, type ValueKind } from './theme';

export interface ComparisonRow {
  label: string;
  current: number;
  previous?: number | null;
}

export interface ComparisonBarsProps {
  data: ComparisonRow[];
  height?: number;
  valueKind?: ValueKind;
  currentLabel?: string;
  previousLabel?: string;
  emptyMessage?: string;
}

/**
 * This period against the last, per category.
 *
 * The comparison pair is separated by lightness and saturation rather than by
 * hue: the current period wears the brand orange, the previous a desaturated
 * slate. A reader with any form of colour vision deficiency still reads
 * "current" as the loud one, and the legend names both regardless.
 */
export function ComparisonBars({
  data,
  height = 280,
  valueKind = 'number',
  currentLabel = 'This period',
  previousLabel = 'Previous period',
  emptyMessage,
}: ComparisonBarsProps) {
  const rows = (Array.isArray(data) ? data : []).filter((row) => row && typeof row.label === 'string');

  if (rows.length === 0) return <ChartEmpty height={height} message={emptyMessage} />;

  const showPrevious = rows.some(
    (row) => typeof row.previous === 'number' && Number.isFinite(row.previous),
  );

  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart
        data={rows}
        margin={{ top: 8, right: 12, left: 0, bottom: 0 }}
        barGap={2}
        barCategoryGap="28%"
      >
        <CartesianGrid vertical={false} stroke={chartTheme.grid} strokeWidth={1} />
        <XAxis
          dataKey="label"
          tick={{ ...axisTick, dy: 4 }}
          tickLine={false}
          axisLine={false}
          interval={0}
          minTickGap={8}
        />
        <YAxis
          tick={axisTick}
          tickLine={false}
          axisLine={false}
          width={52}
          allowDecimals={valueKind === 'percent'}
          tickFormatter={(value: number) => formatAxisValue(value, valueKind)}
        />
        <Tooltip
          content={<ChartTooltip valueKind={valueKind} />}
          cursor={{ fill: chartTheme.hoverFill }}
        />
        {/* One series needs no legend — the card title already names it. */}
        {showPrevious && <Legend content={<ChartLegend markShape="rect" />} />}
        <Bar
          dataKey="current"
          name={currentLabel}
          fill={seriesColor(0)}
          maxBarSize={24}
          radius={[4, 4, 0, 0]}
          isAnimationActive={false}
        />
        {showPrevious && (
          <Bar
            dataKey="previous"
            name={previousLabel}
            fill={chartTheme.comparison}
            maxBarSize={24}
            radius={[4, 4, 0, 0]}
            isAnimationActive={false}
          />
        )}
      </BarChart>
    </ResponsiveContainer>
  );
}
