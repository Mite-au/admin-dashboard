'use client';

import { LineChart as LineChartIcon } from 'lucide-react';
import clsx from 'clsx';
import { chartTheme } from './theme';

/**
 * Chart-local empty treatment. Deliberately quieter than the page-level
 * EmptyState: a chart that has nothing to draw should recede, not announce
 * itself, because the card's own title already says what is missing.
 */
export function ChartEmpty({
  height = 280,
  message = 'No data for this period',
  className,
}: {
  height?: number;
  message?: string;
  className?: string;
}) {
  return (
    <div
      className={clsx('flex flex-col items-center justify-center gap-2', className)}
      style={{ height }}
    >
      <LineChartIcon aria-hidden size={20} strokeWidth={1.5} style={{ color: chartTheme.rule }} />
      <p className="text-xs" style={{ color: chartTheme.mutedText }}>
        {message}
      </p>
    </div>
  );
}
