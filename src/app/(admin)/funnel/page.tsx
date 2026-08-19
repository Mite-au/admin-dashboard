import { Suspense } from 'react';
import { PageHeader } from '@/components/PageHeader';
import { PeriodSelector } from '@/components/PeriodSelector';
import { Topbar } from '@/components/Topbar';
import { FunnelSteps } from '@/components/charts';
import { Card, StatCard } from '@/components/ui';
import { formatNumber, formatPercent } from '@/lib/format';
import { getFunnel } from '@/lib/fetchers';
import { computeDelta, formatDelta } from '@/lib/metrics';
import { periodLabel, previousPeriod, resolvePeriodFromRecord } from '@/lib/period';
import type { FunnelStage } from '@/lib/types';

export default async function FunnelPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const rawParams = await searchParams;
  const { from, to } = resolvePeriodFromRecord(rawParams);
  const period = { from, to };
  const data = await getFunnel(period);

  // Labelled from the requested window rather than the payload's own
  // `since`/`until`: those degrade to an empty string when the backend omits
  // them, which would caption the chart with an em dash.
  const comparison = `${periodLabel(period)} · against ${periodLabel(previousPeriod(period))}`;

  return (
    <>
      <Topbar breadcrumbs={[{ label: 'Funnel', href: '/funnel' }]} />
      <PageHeader
        title="Funnel"
        description="Search through to completed trade, and the step where people leave."
      />

      <div className="space-y-6 px-8 pb-10">
        <Suspense>
          <PeriodSelector />
        </Suspense>

        <div className="grid grid-cols-2 gap-4 lg:grid-cols-3 xl:grid-cols-6">
          <StatCard
            label="Search → trade"
            value={formatPercent(data.searchToTradeRate, { digits: 2 })}
            hint="End to end"
          />
          {data.stages.map((stage) => (
            <StageCard key={stage.key} stage={stage} />
          ))}
        </div>

        <Card title="Where people drop off" subtitle={comparison}>
          <FunnelSteps stages={data.stages} />
          <p className="mt-6 border-t border-ink-100 pt-4 text-data leading-relaxed text-ink-500">
            Searches are counted from the day search tracking shipped, so a period
            reaching back before that under-counts the first stage — and every
            conversion measured against it reads high.
          </p>
        </Card>
      </div>
    </>
  );
}

/**
 * One stage's volume. The delta compares this stage against itself a period
 * ago; the conversion hint compares it against the stage above it, which is
 * the number that says whether the step is working.
 */
function StageCard({ stage }: { stage: FunnelStage }) {
  const delta = computeDelta(stage.count, stage.prevCount);

  return (
    <StatCard
      label={stage.label}
      value={formatNumber(stage.count)}
      delta={{ raw: delta.raw, formatted: formatDelta(delta) }}
      hint={
        stage.conversionFromPrev === null
          ? 'Top of funnel'
          : `${formatPercent(stage.conversionFromPrev)} of previous stage`
      }
    />
  );
}
