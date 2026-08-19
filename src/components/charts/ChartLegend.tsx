'use client';

import { chartTheme } from './theme';

/**
 * Shared legend. Present whenever a chart carries two or more series, so
 * identity is never colour-alone; a single-series chart gets none, because the
 * card title already names what is plotted and a one-swatch box just restates it.
 *
 * The key mirrors the mark: a rounded rect for bars and areas, a short stroke
 * for lines. Labels wear text tokens, never the series colour.
 */

type LegendEntry = {
  value?: string | number;
  color?: string;
  dataKey?: string | number;
};

export interface ChartLegendProps {
  /** Injected by Recharts. */
  payload?: LegendEntry[];
  /** Which mark the key should imitate. */
  markShape?: 'line' | 'rect';
}

export function ChartLegend({ payload, markShape = 'line' }: ChartLegendProps) {
  if (!payload || payload.length === 0) return null;

  return (
    <ul className="flex flex-wrap items-center justify-center gap-x-5 gap-y-1.5 pt-3">
      {payload.map((entry, i) => (
        <li key={`${String(entry.dataKey ?? entry.value ?? i)}`} className="flex items-center gap-2">
          <span
            aria-hidden
            className="inline-block shrink-0"
            style={{
              width: markShape === 'rect' ? 10 : 12,
              height: markShape === 'rect' ? 10 : 2.5,
              borderRadius: markShape === 'rect' ? 3 : 999,
              background: entry.color ?? chartTheme.mutedText,
            }}
          />
          <span className="text-xs" style={{ color: chartTheme.axisText }}>
            {String(entry.value ?? '')}
          </span>
        </li>
      ))}
    </ul>
  );
}
