'use client';

import { useId } from 'react';
import { seriesColor } from './theme';

export interface SparklineProps {
  data: number[];
  color?: string;
  height?: number;
  className?: string;
}

/**
 * Trend shape for a stat tile's footer — no axes, no ticks, no tooltip.
 *
 * Hand-rolled SVG rather than Recharts: at 36px a ResponsiveContainer's resize
 * observer costs more than the mark it measures, and a viewBox with
 * `preserveAspectRatio="none"` already fills whatever width the tile gives it.
 * The stroke is pinned with `vector-effect` so the non-uniform scale cannot
 * stretch it.
 *
 * Decorative by contract: the tile's own value carries the number, so this is
 * hidden from assistive tech rather than described.
 */
export function Sparkline({ data, color, height = 36, className }: SparklineProps) {
  const gradientId = useId().replace(/:/g, '');
  const stroke = color ?? seriesColor(0);

  const values = (Array.isArray(data) ? data : []).filter(
    (value): value is number => typeof value === 'number' && Number.isFinite(value),
  );

  // Hold the slot so a tile with no history doesn't jump when it gets some.
  if (values.length === 0) return <div className={className} style={{ height }} aria-hidden />;

  const width = 100;
  const pad = 3; // keeps the 2px stroke off the top and bottom edges
  const usable = Math.max(height - pad * 2, 1);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min;

  const xAt = (i: number) => (values.length === 1 ? 0 : (i / (values.length - 1)) * width);
  const yAt = (value: number) =>
    span === 0 ? pad + usable / 2 : pad + (1 - (value - min) / span) * usable;

  const line =
    values.length === 1
      ? `M0 ${yAt(values[0])} L${width} ${yAt(values[0])}`
      : values.map((value, i) => `${i === 0 ? 'M' : 'L'}${xAt(i)} ${yAt(value)}`).join(' ');
  const area = `${line} L${width} ${height} L0 ${height} Z`;

  return (
    <svg
      aria-hidden
      className={className}
      width="100%"
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="none"
      focusable="false"
    >
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={stroke} stopOpacity={0.24} />
          <stop offset="100%" stopColor={stroke} stopOpacity={0} />
        </linearGradient>
      </defs>
      <path d={area} fill={`url(#${gradientId})`} stroke="none" />
      <path
        d={line}
        fill="none"
        stroke={stroke}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}
