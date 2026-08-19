'use client';

import clsx from 'clsx';
import { chartTheme } from './theme';

/**
 * Loading placeholder shaped like the chart it stands in for — a y-axis gutter,
 * a plot area of varying column heights, and an x-axis band — so the card does
 * not resize when the data lands.
 *
 * Reuses the app's `skeleton-shimmer` keyframe from globals.css.
 */
const SHIMMER = clsx(
  'relative overflow-hidden rounded-md bg-ink-100/90',
  'before:absolute before:inset-0 before:-translate-x-full before:animate-[skeleton-shimmer_1.8s_ease-in-out_infinite]',
  'before:bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.8),transparent)]',
);

// Irregular on purpose: an even row of bars reads as a real chart, not a wait.
const COLUMN_HEIGHTS = [46, 68, 38, 82, 58, 92, 50, 74, 62, 86, 44, 70];

export function ChartSkeleton({ height = 280 }: { height?: number }) {
  const axisBand = 20;
  const plotHeight = Math.max(height - axisBand, 40);

  return (
    <div style={{ height }} className="flex w-full flex-col gap-2" aria-hidden>
      <div className="flex flex-1 gap-3">
        {/* y-axis tick gutter */}
        <div className="flex w-10 shrink-0 flex-col justify-between py-1">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className={clsx(SHIMMER, 'h-2 w-7')} />
          ))}
        </div>
        {/* plot area */}
        <div
          className="flex flex-1 items-end gap-2 border-b"
          style={{ height: plotHeight, borderColor: chartTheme.grid }}
        >
          {COLUMN_HEIGHTS.map((pct, i) => (
            <div
              key={i}
              className={clsx(SHIMMER, 'min-w-0 flex-1')}
              style={{ height: `${pct}%` }}
            />
          ))}
        </div>
      </div>
      {/* x-axis tick band */}
      <div className="flex justify-between pl-[52px]">
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <div key={i} className={clsx(SHIMMER, 'h-2 w-8')} />
        ))}
      </div>
    </div>
  );
}
