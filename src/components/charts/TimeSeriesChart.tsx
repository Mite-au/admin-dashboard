'use client';

import { useId } from 'react';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { formatDateShort } from '@/lib/format';
import { ChartEmpty } from './ChartEmpty';
import { ChartLegend } from './ChartLegend';
import { ChartTooltip } from './ChartTooltip';
import { axisTick, chartTheme, formatAxisValue, seriesColor, type ValueKind } from './theme';

export type TimeSeriesPoint = Record<string, string | number | null | undefined>;

export interface TimeSeriesSeries {
  /** Key into each row of `data`. */
  key: string;
  /** Human label — legend and tooltip. */
  label: string;
  /** Override the palette slot. Omit to take slot N by position. */
  color?: string;
}

/**
 * Generic over the row type so the app's own point interfaces
 * (`DailyLoginPoint`, `EngagementActivityPoint`, …) can be passed straight
 * through. TypeScript gives implicit index signatures to anonymous object
 * types but not to interfaces, so a plain `Record<…>[]` prop would reject
 * exactly the types the pages already have.
 */
export interface TimeSeriesChartProps<Row extends object = TimeSeriesPoint> {
  data: Row[];
  series: TimeSeriesSeries[];
  /** Row key holding the x value. */
  xKey?: string;
  kind?: 'line' | 'area' | 'bar';
  stacked?: boolean;
  height?: number;
  valueKind?: ValueKind;
  /** Overrides the empty-state copy. */
  emptyMessage?: string;
}

/** ISO dates get the short form; anything else (a bucket name) passes through. */
function formatXTick(value: string | number | undefined): string {
  if (value === null || value === undefined) return '';
  if (typeof value === 'number') return String(value);
  return /^\d{4}-\d{2}-\d{2}/.test(value) ? formatDateShort(value) : value;
}

/**
 * The kit's workhorse: any metric over time, as lines, areas, or columns.
 *
 * Chrome follows the dataviz method — horizontal hairline grid only, no axis
 * rules, ticks thinned to roughly seven so labels never collide, 2px strokes
 * with no dots except on hover, and a legend only once there are two series to
 * tell apart. Animation is off: these charts re-render on every date-range
 * change, and a 300ms replay on each one reads as flicker.
 */
export function TimeSeriesChart<Row extends object = TimeSeriesPoint>({
  data,
  series,
  xKey = 'date',
  kind = 'line',
  stacked = false,
  height = 280,
  valueKind = 'number',
  emptyMessage,
}: TimeSeriesChartProps<Row>) {
  const gradientId = useId().replace(/:/g, '');

  const rows = Array.isArray(data) ? data : [];
  const marks = Array.isArray(series) ? series.filter((s) => s && typeof s.key === 'string') : [];

  // A series can legitimately be all zeros (a gap-filled quiet week) and still
  // deserves a plot. All-null means there is genuinely nothing to draw.
  const hasValues = rows.some((row) => {
    const cells = row as Record<string, unknown>;
    return marks.some((s) => typeof cells?.[s.key] === 'number' && Number.isFinite(cells[s.key] as number));
  });

  if (rows.length === 0 || marks.length === 0 || !hasValues) {
    return <ChartEmpty height={height} message={emptyMessage} />;
  }

  const singlePoint = rows.length === 1;
  // Aim for ~7 ticks regardless of range length.
  const tickInterval = rows.length <= 8 ? 0 : Math.ceil(rows.length / 7) - 1;
  const showLegend = marks.length > 1;
  const margin = { top: 8, right: 12, left: 0, bottom: 0 };

  const grid = (
    <CartesianGrid key="grid" vertical={false} stroke={chartTheme.grid} strokeWidth={1} />
  );
  const xAxis = (
    <XAxis
      key="x"
      dataKey={xKey}
      tick={{ ...axisTick, dy: 4 }}
      tickLine={false}
      axisLine={false}
      interval={tickInterval}
      minTickGap={16}
      tickFormatter={formatXTick}
      {...(kind === 'bar' ? {} : { padding: { left: 8, right: 8 } })}
    />
  );
  const yAxis = (
    <YAxis
      key="y"
      tick={axisTick}
      tickLine={false}
      axisLine={false}
      width={52}
      allowDecimals={valueKind === 'percent'}
      tickFormatter={(value: number) => formatAxisValue(value, valueKind)}
    />
  );
  const tooltip = (
    <Tooltip
      key="tooltip"
      content={<ChartTooltip valueKind={valueKind} labelFormatter={formatXTick} />}
      cursor={
        kind === 'bar'
          ? { fill: chartTheme.hoverFill }
          : { stroke: chartTheme.rule, strokeWidth: 1 }
      }
    />
  );
  const legend = showLegend ? (
    <Legend key="legend" content={<ChartLegend markShape={kind === 'line' ? 'line' : 'rect'} />} />
  ) : null;

  const frame = [grid, xAxis, yAxis, tooltip, legend];

  if (kind === 'bar') {
    return (
      <ResponsiveContainer width="100%" height={height}>
        <BarChart data={rows} margin={margin} barGap={2} barCategoryGap="24%">
          {frame}
          {marks.map((s, i) => (
            <Bar
              key={s.key}
              dataKey={s.key}
              name={s.label}
              fill={s.color ?? seriesColor(i)}
              maxBarSize={24}
              // Round the data-end only; the baseline stays square. In a stack
              // that end belongs to the top segment.
              radius={stacked ? (i === marks.length - 1 ? [4, 4, 0, 0] : 0) : [4, 4, 0, 0]}
              stackId={stacked ? 'stack' : undefined}
              // A surface-coloured stroke IS the 2px gap between stacked
              // segments — it adds no ink of its own.
              stroke={stacked ? chartTheme.surface : undefined}
              strokeWidth={stacked ? 2 : 0}
              isAnimationActive={false}
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
    );
  }

  if (kind === 'area') {
    return (
      <ResponsiveContainer width="100%" height={height}>
        <AreaChart data={rows} margin={margin}>
          <defs>
            {marks.map((s, i) => {
              const color = s.color ?? seriesColor(i);
              return (
                <linearGradient
                  key={s.key}
                  id={`${gradientId}-${i}`}
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="1"
                >
                  <stop offset="0%" stopColor={color} stopOpacity={0.22} />
                  <stop offset="100%" stopColor={color} stopOpacity={0} />
                </linearGradient>
              );
            })}
          </defs>
          {frame}
          {marks.map((s, i) => {
            const color = s.color ?? seriesColor(i);
            return (
              <Area
                key={s.key}
                type="monotone"
                dataKey={s.key}
                name={s.label}
                stroke={color}
                strokeWidth={2}
                fill={`url(#${gradientId}-${i})`}
                fillOpacity={1}
                stackId={stacked ? 'stack' : undefined}
                dot={
                  singlePoint
                    ? { r: 4, fill: color, stroke: chartTheme.surface, strokeWidth: 2 }
                    : false
                }
                activeDot={{ r: 4, stroke: chartTheme.surface, strokeWidth: 2 }}
                connectNulls={false}
                isAnimationActive={false}
              />
            );
          })}
        </AreaChart>
      </ResponsiveContainer>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={rows} margin={margin}>
        {frame}
        {marks.map((s, i) => {
          const color = s.color ?? seriesColor(i);
          return (
            <Line
              key={s.key}
              type="monotone"
              dataKey={s.key}
              name={s.label}
              stroke={color}
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
              // One point draws no line segment, so show the mark itself.
              dot={
                singlePoint
                  ? { r: 4, fill: color, stroke: chartTheme.surface, strokeWidth: 2 }
                  : false
              }
              activeDot={{ r: 4, stroke: chartTheme.surface, strokeWidth: 2 }}
              connectNulls={false}
              isAnimationActive={false}
            />
          );
        })}
      </LineChart>
    </ResponsiveContainer>
  );
}
