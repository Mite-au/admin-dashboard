import { FunnelStrip } from '@/components/charts';
import { Card } from '@/components/ui';
import { formatPercent } from '@/lib/format';
import { periodLabel, type PeriodParams, type PeriodRange } from '@/lib/period';
import type { FunnelResponse, FunnelStageKey } from '@/lib/types';
import { DetailLink, SectionError, periodHref } from '../parts';

/**
 * Short names for the strip. The backend's labels ("Trades completed") are
 * right for the full funnel page but wrap or clip in a five-column row; a
 * stage the backend adds later falls back to its own label.
 */
const SHORT_LABELS: Partial<Record<FunnelStageKey, string>> = {
  searches: 'Searches',
  chatsStarted: 'Chats started',
  offersMade: 'Offers made',
  offersAccepted: 'Accepted',
  tradesCompleted: 'Trades',
};

const shortLabel = (key: FunnelStageKey, label: string) => SHORT_LABELS[key] ?? label;

/**
 * The marketplace's core loop in one row: searches that became chats, offers
 * and confirmed trades. Each stage is a period total counted on its own — the
 * backend does not follow one cohort through — so the connectors are ratios
 * of adjacent totals, and the footer says so in plain words.
 */
export function TradePathCard({
  data,
  period,
  periodParams,
}: {
  data: FunnelResponse | null;
  period: PeriodRange;
  periodParams: PeriodParams;
}) {
  const link = <DetailLink href={periodHref('/funnel', periodParams)}>Full funnel</DetailLink>;

  if (!data) {
    return (
      <Card title="Trade path" subtitle={periodLabel(period)} actions={link} className="h-full">
        <SectionError label="Funnel" />
      </Card>
    );
  }

  const stages = data.stages.map((stage) => ({
    ...stage,
    label: shortLabel(stage.key, stage.label),
  }));
  const searches = stages[0]?.count ?? 0;

  // Lowest step-to-step conversion, not the largest absolute loss: the first
  // transition is almost always the biggest by count and says the least.
  let worst: { from: string; to: string; rate: number } | null = null;
  if (stages.length >= 3) {
    for (let i = 1; i < stages.length; i += 1) {
      const rate = stages[i].conversionFromPrev;
      if (rate === null) continue;
      if (worst === null || rate < worst.rate) {
        worst = { from: stages[i - 1].label, to: stages[i].label, rate };
      }
    }
  }

  return (
    <Card
      title="Trade path"
      subtitle={`${periodLabel(period)} · each stage against the one before it`}
      actions={link}
      className="h-full"
    >
      <FunnelStrip
        stages={stages.map((stage) => ({
          label: stage.label,
          count: stage.count,
          prevCount: stage.prevCount,
        }))}
      />
      <div className="mt-5 flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1 border-t border-ink-100 pt-3">
        <p className="text-data text-ink-700">
          {searches > 0 ? (
            <>
              <span className="tnum font-semibold text-ink-900">
                {formatPercent(data.searchToTradeRate, { digits: 2 })}
              </span>{' '}
              of searches ended in a confirmed trade
              {worst && (
                <>
                  . Biggest drop-off between {worst.from.toLowerCase()} and{' '}
                  {worst.to.toLowerCase()}: only{' '}
                  <span className="tnum font-semibold text-ink-900">
                    {formatPercent(worst.rate, { digits: 0 })}
                  </span>{' '}
                  continue
                </>
              )}
              .
            </>
          ) : (
            'No searches were recorded in this period.'
          )}
        </p>
        <p className="text-2xs text-ink-400">
          Period totals per stage, not one cohort followed through.
        </p>
      </div>
    </Card>
  );
}
