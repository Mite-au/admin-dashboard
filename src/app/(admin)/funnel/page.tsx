import { ArrowRight, TrendingUp } from 'lucide-react';
import { Topbar } from '@/components/Topbar';
import { PageHeader } from '@/components/PageHeader';
import { PeriodSelector } from '@/components/PeriodSelector';
import { getFunnel } from '@/lib/fetchers';
import { formatNumber } from '@/lib/format';
import { resolvePeriodFromRecord } from '@/lib/period';
import type { FunnelStage } from '@/lib/types';
import { FunnelChart } from './FunnelChart';

export default async function FunnelPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const rawParams = await searchParams;
  const { from, to } = resolvePeriodFromRecord(rawParams);
  const data = await getFunnel({ from, to });

  return (
    <>
      <Topbar breadcrumbs={[{ label: 'Funnel', href: '/funnel' }]} />
      <PageHeader title="Funnel" />

      <div className="px-8 pb-10 space-y-8">
        <PeriodSelector />

        <section className="inner-card p-5 flex items-center justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-wide text-ink-500 font-semibold">
              Search → completed trade
            </p>
            <p className="mt-2 text-3xl font-extrabold text-ink-900">
              {(data.searchToTradeRate * 100).toFixed(2)}%
            </p>
            <p className="mt-1 text-xs text-ink-500">
              End-to-end conversion for the selected period. Searches are counted
              from when search tracking shipped — early periods may under-count
              the first stage.
            </p>
          </div>
          <span className="rounded-xl bg-ink-50 p-2.5 text-ink-700 shrink-0">
            <TrendingUp size={18} strokeWidth={1.75} />
          </span>
        </section>

        <section className="space-y-3">
          <h2 className="text-base font-semibold text-ink-900">
            Stage volumes · this period vs previous
          </h2>
          <div className="inner-card p-5">
            <FunnelChart stages={data.stages} />
          </div>
        </section>

        <section className="space-y-3">
          <h2 className="text-base font-semibold text-ink-900">Stage conversion</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {data.stages.map((stage) => (
              <StageCard key={stage.key} stage={stage} />
            ))}
          </div>
        </section>
      </div>
    </>
  );
}

function StageCard({ stage }: { stage: FunnelStage }) {
  const delta = stage.count - stage.prevCount;
  const deltaClass =
    delta > 0 ? 'text-emerald-600' : delta < 0 ? 'text-red-600' : 'text-ink-500';
  return (
    <div className="inner-card p-5">
      <p className="text-xs uppercase tracking-wide text-ink-500 font-semibold">
        {stage.label}
      </p>
      <p className="mt-2 text-3xl font-extrabold text-ink-900">
        {formatNumber(stage.count)}
      </p>
      <p className={`mt-1 text-xs font-medium tabular-nums ${deltaClass}`}>
        {delta > 0 ? '+' : ''}
        {formatNumber(delta)} vs previous ({formatNumber(stage.prevCount)})
      </p>
      {stage.conversionFromPrev !== null && (
        <p className="mt-2 text-xs text-ink-500 flex items-center gap-1">
          <ArrowRight size={12} strokeWidth={2} />
          {(stage.conversionFromPrev * 100).toFixed(1)}% of previous stage
        </p>
      )}
    </div>
  );
}
