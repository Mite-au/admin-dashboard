'use client';

import { Fragment } from 'react';
import { ArrowDown, ArrowUp, ChevronRight, TrendingDown } from 'lucide-react';
import clsx from 'clsx';
import { formatCompact, formatPercent } from '@/lib/format';
import { ChartEmpty } from './ChartEmpty';
import { chartTheme, funnelStageColor } from './theme';

export interface FunnelStripStage {
  label: string;
  count: number;
  /** Same stage, previous period. Enables the per-stage change marker. */
  prevCount?: number | null;
}

export interface FunnelStripProps {
  stages: FunnelStripStage[];
  className?: string;
}

const safeCount = (value: unknown): number =>
  typeof value === 'number' && Number.isFinite(value) && value > 0 ? value : 0;

/**
 * The funnel as a path, left to right.
 *
 * `FunnelSteps` is the analytical view: one bar per stage stacked down the
 * page, with room between each pair for the drop-off. This is the digest of
 * the same numbers for a page that has other things to show — one row, every
 * stage count on a single baseline, and the conversion between each pair in
 * the gutter, so the whole route from search to trade reads in one pass.
 *
 * Each bar is the step's own conversion — how much of the stage before it
 * continued — so it echoes the connector figure rather than the share of the
 * first stage. A share-of-first bar would be a sliver from the second stage
 * on (a marketplace funnel loses ~90% at the first step) and would show
 * nothing about where the later leaks are, which is the question the strip
 * exists to answer. The caption under each count states that same
 * conversion, so bar and caption always agree; the share of the first stage
 * lives in the bar's tooltip. The connector between stages is decorative
 * (aria-hidden) apart from marking the weakest step. Stage colour is the same
 * ordinal ramp as
 * FunnelSteps: order carries meaning, so it runs light at the mouth to deepest
 * at the outcome. The weakest step wears the warning colour AND a different
 * icon, so it is never identified by colour alone.
 */
export function FunnelStrip({ stages, className }: FunnelStripProps) {
  const rows = (Array.isArray(stages) ? stages : []).filter(
    (stage) => stage && typeof stage.label === 'string',
  );
  if (rows.length === 0) return <ChartEmpty height={120} />;

  const counts = rows.map((stage) => safeCount(stage.count));
  const first = counts[0];

  const steps = rows.map((stage, i) => {
    const count = counts[i];
    const prior = i > 0 ? counts[i - 1] : null;
    const prevCount =
      typeof stage.prevCount === 'number' && Number.isFinite(stage.prevCount)
        ? stage.prevCount
        : null;
    return {
      label: stage.label,
      count,
      share: first > 0 ? count / first : 0,
      conversion: prior !== null && prior > 0 ? count / prior : null,
      delta: prevCount !== null && prevCount > 0 ? (count - prevCount) / prevCount : null,
    };
  });

  // The step people actually fall out of — lowest conversion, not largest
  // absolute loss. Only meaningful with more than one transition to compare.
  let worstStep = -1;
  if (steps.length >= 3) {
    let worst = Number.POSITIVE_INFINITY;
    steps.forEach((step, i) => {
      if (step.conversion !== null && step.conversion < worst) {
        worst = step.conversion;
        worstStep = i;
      }
    });
  }

  const columns = steps
    .map((_, i) => (i === 0 ? 'minmax(0, 1fr)' : 'auto minmax(0, 1fr)'))
    .join(' ');

  return (
    <div className={clsx('overflow-x-auto', className)}>
      <div className="grid min-w-[560px] items-start" style={{ gridTemplateColumns: columns }}>
        {steps.map((step, i) => {
          const isWorst = i === worstStep;
          const continued = i === 0 ? (step.count > 0 ? 1 : 0) : (step.conversion ?? 0);
          const barWidth = continued > 0 ? Math.max(Math.min(continued, 1) * 100, 1.5) : 0;
          const ConnectorIcon = isWorst ? TrendingDown : ChevronRight;
          const conversionText =
            step.conversion === null ? '—' : formatPercent(step.conversion, { digits: 0 });

          return (
            <Fragment key={`${step.label}-${i}`}>
              {i > 0 && (
                // Sits on the number row of the neighbouring stages: 26px is
                // the label line plus half the difference to the title line.
                <div aria-hidden="true" className="flex items-center px-1.5 pt-[26px]">
                  <ConnectorIcon
                    size={14}
                    strokeWidth={2.25}
                    style={{ color: isWorst ? chartTheme.warning : chartTheme.rule }}
                  />
                </div>
              )}

              <div className="min-w-0">
                <p className="label-micro truncate" title={step.label}>
                  {step.label}
                </p>
                <div className="mt-1 flex flex-wrap items-baseline gap-x-2">
                  <span
                    className="tnum text-title font-semibold"
                    style={{ color: chartTheme.strongText }}
                  >
                    {formatCompact(step.count)}
                  </span>
                  {step.delta !== null && (
                    <span
                      className="inline-flex items-center gap-0.5 text-2xs font-medium tabular-nums"
                      style={{
                        color: step.delta >= 0 ? chartTheme.positive : chartTheme.negative,
                      }}
                    >
                      {step.delta >= 0 ? (
                        <ArrowUp aria-hidden size={11} strokeWidth={2.5} />
                      ) : (
                        <ArrowDown aria-hidden size={11} strokeWidth={2.5} />
                      )}
                      <span className="sr-only">{step.delta >= 0 ? 'up ' : 'down '}</span>
                      {formatPercent(Math.abs(step.delta), { digits: 0 })}
                      <span className="sr-only"> against the previous period</span>
                    </span>
                  )}
                </div>
                <p
                  className="mt-0.5 text-2xs tabular-nums"
                  style={{ color: isWorst ? chartTheme.warning : chartTheme.mutedText }}
                >
                  {i === 0
                    ? 'Starting point'
                    : `${conversionText} of ${steps[i - 1].label.toLowerCase()} continued`}
                  {isWorst && <span className="sr-only"> (biggest drop-off)</span>}
                </p>
                <div
                  className="mt-2 h-2 w-full overflow-hidden rounded-full"
                  style={{ background: chartTheme.track }}
                  title={
                    i === 0
                      ? 'Starting stage'
                      : `${conversionText} of ${steps[i - 1].label.toLowerCase()} continued · ${formatPercent(step.share, { digits: step.share < 0.1 ? 1 : 0 })} of ${steps[0].label.toLowerCase()}`
                  }
                >
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${barWidth}%`,
                      background: funnelStageColor(i, steps.length),
                    }}
                  />
                </div>
              </div>
            </Fragment>
          );
        })}
      </div>
    </div>
  );
}
