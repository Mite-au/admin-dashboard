'use client';

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';
import { formatPercent } from '@/lib/format';
import { ChartEmpty } from './ChartEmpty';
import { ChartTooltip } from './ChartTooltip';
import { chartTheme, formatValue, seriesColor, type ValueKind } from './theme';

export interface DonutDatum {
  label: string;
  value: number;
  color?: string;
}

export interface DonutChartProps {
  data: DonutDatum[];
  height?: number;
  valueKind?: ValueKind;
  /** Caption under the centre total, e.g. "logins". */
  centerLabel?: string;
  emptyMessage?: string;
}

/**
 * Share of a total — logins by method, listings by category.
 *
 * Part-to-whole reads at a glance only while the segment count stays small, so
 * anything past six folds its tail into "Other" rather than shaving the ring
 * into slivers nobody can compare. The side legend carries the exact value and
 * percentage for every segment, which is what makes the donut legal at all: no
 * value here is reachable only by hovering.
 *
 * Segments are separated by a real angular gap, not a stroke — a border around
 * a mark is ink that isn't data.
 */
const MAX_SEGMENTS = 6;

export function DonutChart({
  data,
  height = 220,
  valueKind = 'number',
  centerLabel,
  emptyMessage,
}: DonutChartProps) {
  const cleaned = (Array.isArray(data) ? data : []).filter(
    (datum) =>
      datum &&
      typeof datum.label === 'string' &&
      typeof datum.value === 'number' &&
      Number.isFinite(datum.value) &&
      datum.value > 0,
  );

  const total = cleaned.reduce((sum, datum) => sum + datum.value, 0);
  if (cleaned.length === 0 || total <= 0) {
    return <ChartEmpty height={height} message={emptyMessage} />;
  }

  let segments = cleaned;
  if (cleaned.length > MAX_SEGMENTS) {
    const sorted = [...cleaned].sort((a, b) => b.value - a.value);
    const head = sorted.slice(0, MAX_SEGMENTS - 1);
    segments = [
      ...head,
      {
        label: 'Other',
        value: sorted.slice(MAX_SEGMENTS - 1).reduce((sum, datum) => sum + datum.value, 0),
        color: chartTheme.comparison,
      },
    ];
  }

  const colored = segments.map((segment, i) => ({
    ...segment,
    fill: segment.color ?? seriesColor(i),
  }));

  return (
    <div className="flex flex-col items-center gap-6 sm:flex-row">
      <div className="relative shrink-0" style={{ width: height, height }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Tooltip content={<ChartTooltip valueKind={valueKind} hideLabel />} />
            <Pie
              data={colored}
              dataKey="value"
              nameKey="label"
              innerRadius="62%"
              outerRadius="92%"
              paddingAngle={2}
              cornerRadius={3}
              stroke="none"
              isAnimationActive={false}
            >
              {colored.map((segment) => (
                <Cell key={segment.label} fill={segment.fill} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>

        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          {/* Proportional figures: tabular-nums makes a big standalone number look loose. */}
          <span className="text-xl font-semibold" style={{ color: chartTheme.strongText }}>
            {formatValue(total, valueKind)}
          </span>
          {centerLabel && (
            <span className="mt-0.5 text-[11px]" style={{ color: chartTheme.mutedText }}>
              {centerLabel}
            </span>
          )}
        </div>
      </div>

      <ul className="w-full min-w-0 flex-1 space-y-2">
        {colored.map((segment) => (
          <li key={segment.label} className="flex items-center gap-2.5 text-xs">
            <span
              aria-hidden
              className="inline-block shrink-0 rounded-[3px]"
              style={{ width: 10, height: 10, background: segment.fill }}
            />
            <span className="mr-auto truncate" style={{ color: chartTheme.axisText }}>
              {segment.label}
            </span>
            <span
              className="shrink-0 font-medium tabular-nums"
              style={{ color: chartTheme.strongText }}
            >
              {formatValue(segment.value, valueKind)}
            </span>
            <span
              className="w-11 shrink-0 text-right tabular-nums"
              style={{ color: chartTheme.mutedText }}
            >
              {formatPercent(segment.value / total)}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
