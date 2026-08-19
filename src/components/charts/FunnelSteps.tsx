'use client';

import { ArrowDown, ArrowUp, TrendingDown } from 'lucide-react';
import clsx from 'clsx';
import { formatCompact, formatPercent } from '@/lib/format';
import { ChartEmpty } from './ChartEmpty';
import { chartTheme, funnelStageColor } from './theme';

export interface FunnelStageInput {
  label: string;
  count: number;
  /** Same stage, previous period. Enables the comparison marker and delta. */
  prevCount?: number | null;
}

export interface FunnelStepsProps {
  stages: FunnelStageInput[];
  className?: string;
}

const safeCount = (value: unknown): number =>
  typeof value === 'number' && Number.isFinite(value) && value > 0 ? value : 0;

/**
 * A funnel drawn as a funnel.
 *
 * A grouped bar chart answers "how big is each stage" but hides the thing a
 * funnel exists to show: where people leave. So each stage is a horizontal bar
 * whose width is its share of the first stage, and the space *between* bars —
 * normally dead margin — carries the step-to-step conversion and the absolute
 * loss. The worst step is called out by name and icon, not by colour alone.
 *
 * Stage colour is an ordinal ramp on the brand hue, not categorical slots:
 * reordering funnel stages would change their meaning, so the reader should see
 * the sequence in the colour. It runs light at the mouth to deepest at the
 * outcome, so the converted stage is the most emphatic mark on screen.
 */
export function FunnelSteps({ stages, className }: FunnelStepsProps) {
  const rows = (Array.isArray(stages) ? stages : []).filter(
    (stage) => stage && typeof stage.label === 'string',
  );

  if (rows.length === 0) return <ChartEmpty height={220} />;

  const counts = rows.map((stage) => safeCount(stage.count));
  const firstCount = counts[0];
  const prevFirstCount = safeCount(rows[0]?.prevCount);

  const steps = rows.map((stage, i) => {
    const count = counts[i];
    const priorCount = i > 0 ? counts[i - 1] : null;
    const prevCount =
      typeof stage.prevCount === 'number' && Number.isFinite(stage.prevCount)
        ? stage.prevCount
        : null;

    return {
      label: stage.label,
      count,
      /** Share of the first stage — what the bar width encodes. */
      share: firstCount > 0 ? count / firstCount : 0,
      /** Conversion from the stage above. Null for the first stage. */
      conversion: priorCount !== null && priorCount > 0 ? count / priorCount : null,
      /** People lost between the stage above and this one. */
      drop: priorCount !== null ? Math.max(priorCount - count, 0) : null,
      /** Change in this stage's own volume against the previous period. */
      delta: prevCount !== null && prevCount > 0 ? (count - prevCount) / prevCount : null,
      /**
       * Where this stage sat in the previous period's funnel, as a share of
       * *that* period's first stage. Comparing shape rather than volume keeps
       * the marker on-scale even when the two periods differ in size.
       */
      prevShare:
        prevCount !== null && prevFirstCount > 0
          ? Math.min(prevCount / prevFirstCount, 1)
          : null,
    };
  });

  // The step people actually fall out of — lowest conversion, not largest
  // absolute loss (the first transition is almost always the largest by count).
  // Only meaningful once there is more than one transition to compare.
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

  const hasComparison = steps.some((step) => step.prevShare !== null || step.delta !== null);

  return (
    <div className={clsx('w-full', className)}>
      {steps.map((step, i) => {
        const isWorst = i === worstStep;
        const barWidth = step.count > 0 ? Math.max(step.share * 100, 1.5) : 0;

        return (
          <div key={`${step.label}-${i}`}>
            {/* Connector: the drop-off between the stage above and this one. */}
            {i > 0 && (
              <div className="relative py-2 pl-5">
                <span
                  aria-hidden
                  className="absolute left-[7px] top-0 bottom-0 w-px"
                  style={{ background: chartTheme.grid }}
                />
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px]">
                  <ArrowDown
                    aria-hidden
                    size={12}
                    strokeWidth={2}
                    style={{ color: isWorst ? chartTheme.warning : chartTheme.mutedText }}
                  />
                  <span
                    className="font-medium tabular-nums"
                    style={{ color: isWorst ? chartTheme.warning : chartTheme.axisText }}
                  >
                    {step.conversion === null ? '—' : formatPercent(step.conversion)} continue
                  </span>
                  {step.drop !== null && step.drop > 0 && (
                    <span className="tabular-nums" style={{ color: chartTheme.mutedText }}>
                      · {formatCompact(step.drop)} lost
                    </span>
                  )}
                  {isWorst && (
                    <span
                      className="inline-flex items-center gap-1 font-medium"
                      style={{ color: chartTheme.warning }}
                    >
                      <TrendingDown aria-hidden size={12} strokeWidth={2} />
                      Biggest drop-off
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* Stage. */}
            <div>
              <div className="flex items-baseline justify-between gap-3">
                <div className="flex items-baseline gap-2 min-w-0">
                  <span
                    className="text-sm font-medium truncate"
                    style={{ color: chartTheme.labelText }}
                  >
                    {step.label}
                  </span>
                  <span
                    className="text-[11px] tabular-nums shrink-0"
                    style={{ color: chartTheme.mutedText }}
                  >
                    {/* Context for the bar, so whole percents — the analytical
                        number is the conversion rate in the connector. */}
                    {formatPercent(step.share, { digits: 0 })}
                  </span>
                </div>
                <div className="flex items-baseline gap-2 shrink-0">
                  <span
                    className="text-sm font-semibold tabular-nums"
                    style={{ color: chartTheme.strongText }}
                  >
                    {formatCompact(step.count)}
                  </span>
                  {step.delta !== null && (
                    <span
                      className="inline-flex items-center gap-0.5 text-[11px] font-medium tabular-nums"
                      style={{
                        color: step.delta >= 0 ? chartTheme.positive : chartTheme.negative,
                      }}
                    >
                      {step.delta >= 0 ? (
                        <ArrowUp aria-hidden size={11} strokeWidth={2.5} />
                      ) : (
                        <ArrowDown aria-hidden size={11} strokeWidth={2.5} />
                      )}
                      {formatPercent(Math.abs(step.delta))}
                    </span>
                  )}
                </div>
              </div>

              <div
                className="relative mt-1.5 h-7 w-full overflow-hidden rounded-md"
                style={{ background: chartTheme.track }}
              >
                <div
                  className="h-full rounded-md"
                  style={{ width: `${barWidth}%`, background: funnelStageColor(i, steps.length) }}
                />
                {step.prevShare !== null && (
                  <span
                    aria-hidden
                    className="absolute top-0 bottom-0 w-0.5 rounded-full"
                    style={{
                      left: `calc(${Math.min(step.prevShare * 100, 100)}% - 1px)`,
                      background: chartTheme.comparisonRule,
                    }}
                  />
                )}
              </div>
            </div>
          </div>
        );
      })}

      {/* The comparison marker needs naming — identity is never a bare mark. */}
      {hasComparison && (
        <div className="mt-4 flex items-center gap-2">
          <span
            aria-hidden
            className="inline-block h-3 w-0.5 rounded-full"
            style={{ background: chartTheme.comparisonRule }}
          />
          <span className="text-[11px]" style={{ color: chartTheme.mutedText }}>
            Previous period, as a share of its own first stage
          </span>
        </div>
      )}
    </div>
  );
}
