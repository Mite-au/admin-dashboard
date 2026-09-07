import { Suspense } from 'react';
import { TriangleAlert } from 'lucide-react';
import clsx from 'clsx';
import { PageHeader } from '@/components/PageHeader';
import { PeriodSelector } from '@/components/PeriodSelector';
import { Topbar } from '@/components/Topbar';
import { FunnelSteps } from '@/components/charts';
import { Card, StatCard, type StatDelta } from '@/components/ui';
import { formatDeltaPoints, formatNumber, formatPercent } from '@/lib/format';
import { getFunnel, optional } from '@/lib/fetchers';
import { computeDelta, formatDelta, safeRate, stageConversions } from '@/lib/metrics';
import { periodLabel, previousPeriod, resolvePeriodFromRecord } from '@/lib/period';
import type { FunnelResponse, FunnelStage, FunnelStageKey } from '@/lib/types';

/**
 * What each stage actually counts, in the backend's own terms. The stage
 * labels arrive from the API and are shown verbatim; these hints carry the
 * qualifications the labels leave out — above all that "Searches" is a
 * narrow, event-sourced subset.
 */
const STAGE_HINTS: Partial<Record<FunnelStageKey, string>> = {
  searches: 'Searches by signed-in users, first page of results only. Guests are never recorded.',
  chatsStarted: 'Conversations created in this period.',
  offersMade: 'Offers created in this period.',
  offersAccepted: 'Offers that reached accepted status in this period.',
  tradesCompleted: 'Appointments both parties confirmed, dated by the later confirmation.',
};

export default async function FunnelPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const rawParams = await searchParams;
  const { from, to } = resolvePeriodFromRecord(rawParams);
  const period = { from, to };
  const prevRange = previousPeriod(period);

  // The comparison window is a second request, so it gets its own `optional`:
  // a funnel that loads without its predecessor should still draw, minus the
  // rate deltas, rather than take the page down.
  const [data, prev] = await Promise.all([
    optional(getFunnel(period)),
    optional(getFunnel(prevRange)),
  ]);

  // Labelled from the requested window rather than the payload's own
  // `since`/`until`: those degrade to an empty string when the backend omits
  // them, which would caption the chart with an em dash.
  const comparison = `${periodLabel(period)} · against ${periodLabel(prevRange)}`;

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

        {data === null ? (
          <LoadError />
        ) : (
          <FunnelBody data={data} prev={prev} comparison={comparison} />
        )}
      </div>
    </>
  );
}

/** A stage reduced to what this page renders, with conversion already resolved. */
interface StageStat {
  key: FunnelStageKey;
  label: string;
  count: number;
  /** Share of the stage above, 0–1. Null for the first stage or an empty one. */
  conversion: number | null;
}

/**
 * Conversions are recomputed from the counts on BOTH sides rather than read
 * from `conversionFromPrev` on one side and derived on the other — two
 * formulas producing the two halves of a percentage-point delta is how a
 * "change" ends up measuring rounding.
 */
function readStages(stages: FunnelStage[]): StageStat[] {
  const conversions = stageConversions(stages);
  return stages.map((stage, i) => ({
    key: stage.key,
    label: stage.label,
    count: stage.count,
    conversion: conversions[i].fromPrevious,
  }));
}

const countOf = (stats: StageStat[], key: FunnelStageKey): number | null =>
  stats.find((stat) => stat.key === key)?.count ?? null;

/** One stage's count over another's, as a fraction. Null if either is missing. */
function ratioOf(stats: StageStat[], numerator: FunnelStageKey, denominator: FunnelStageKey) {
  const top = countOf(stats, numerator);
  const bottom = countOf(stats, denominator);
  if (top === null || bottom === null) return null;
  return safeRate(top, bottom);
}

function FunnelBody({
  data,
  prev,
  comparison,
}: {
  data: FunnelResponse;
  prev: FunnelResponse | null;
  comparison: string;
}) {
  const current = readStages(data.stages);
  // When the comparison request failed, the previous period is rebuilt from
  // the `prevCount` every stage already carries — the same windows, computed
  // by the same backend, so the deltas survive a dropped request.
  const previous = readStages(
    prev?.stages ?? data.stages.map((stage) => ({ ...stage, count: stage.prevCount })),
  );
  const previousByKey = new Map(previous.map((stat) => [stat.key, stat]));

  const acceptance = ratioOf(current, 'offersAccepted', 'offersMade');
  const prevAcceptance = ratioOf(previous, 'offersAccepted', 'offersMade');
  const completion = ratioOf(current, 'tradesCompleted', 'offersAccepted');
  const prevCompletion = ratioOf(previous, 'tradesCompleted', 'offersAccepted');
  const prevSearchToTrade = ratioOf(previous, 'tradesCompleted', 'searches');

  return (
    <>
      <div className="space-y-4">
        <h3 className="label-micro">Conversion rates</h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <StatCard
            label="Offer acceptance"
            value={formatPercent(acceptance)}
            delta={pointsDelta(acceptance, prevAcceptance)}
            hint="Offers accepted ÷ offers made in this period."
          />
          <StatCard
            label="Trade completion"
            value={formatPercent(completion)}
            delta={pointsDelta(completion, prevCompletion)}
            hint="Trades both parties confirmed ÷ offers accepted in this period."
          />
          <StatCard
            label="Search to trade"
            value={formatPercent(data.searchToTradeRate, { digits: 2 })}
            delta={pointsDelta(data.searchToTradeRate, prevSearchToTrade)}
            hint="Trades ÷ searches. Two independent totals, not one journey followed through."
          />
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="label-micro">Stage volumes</h3>
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
          {data.stages.map((stage) => (
            <StatCard
              key={stage.key}
              label={stage.label}
              value={formatNumber(stage.count)}
              delta={countDelta(stage.count, stage.prevCount)}
              hint={STAGE_HINTS[stage.key] ?? 'Events counted in this period.'}
            />
          ))}
        </div>
      </div>

      <Card title="Where people drop off" subtitle={comparison}>
        <FunnelSteps stages={data.stages} />
        <p className="mt-6 border-t border-ink-100 pt-4 text-data leading-relaxed text-ink-500">
          Every stage is counted on its own inside the window, so this is not one
          group of people followed to the end — the people who searched here and
          the people who traded here are largely different. Read each figure as a
          ratio between two totals. Searches are also the only stage taken from
          analytics events, and those start the day search tracking shipped, so a
          window reaching back further under-counts the first stage and makes
          every rate measured against it read high.
        </p>
      </Card>

      <Card
        title="Stage-to-stage conversion"
        subtitle={`${comparison} · the numbers behind the chart`}
        bleed
      >
        <div className="overflow-x-auto scroll-slim">
          <table className="data-table">
            <thead>
              <tr>
                <th>Stage</th>
                <th>This period</th>
                <th>Previous period</th>
                <th>From prior stage</th>
                <th>Previously</th>
                <th>Change</th>
              </tr>
            </thead>
            <tbody>
              {current.map((stat, i) => {
                const before = previousByKey.get(stat.key) ?? null;
                const isFirst = i === 0;

                return (
                  <tr key={stat.key}>
                    <td>{stat.label}</td>
                    <td className="tnum">{formatNumber(stat.count)}</td>
                    <td className="tnum text-ink-500">
                      {before === null ? '—' : formatNumber(before.count)}
                    </td>
                    <td className="tnum">
                      {isFirst ? (
                        <span className="text-ink-400">Top of funnel</span>
                      ) : (
                        formatPercent(stat.conversion)
                      )}
                    </td>
                    <td className="tnum text-ink-500">
                      {isFirst ? '—' : formatPercent(before?.conversion ?? null)}
                    </td>
                    <td>
                      {isFirst ? (
                        <span className="text-ink-400">—</span>
                      ) : (
                        <PointsChange current={stat.conversion} previous={before?.conversion ?? null} />
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </>
  );
}

/**
 * Delta builders for `StatCard`, in the `{ raw, formatted }` shape it expects.
 * `raw` decides the colour and `formatted` the printed text, which is what
 * lets a rate render in percentage POINTS while still colouring by direction.
 */
function countDelta(current: number, previous: number): StatDelta {
  const delta = computeDelta(current, previous);
  return { raw: delta.raw, formatted: formatDelta(delta) };
}

/** Two rates differ in percentage POINTS, never in percent. */
function pointsDelta(current: number | null, previous: number | null): StatDelta | undefined {
  if (current === null || previous === null) return undefined;
  const delta = computeDelta(current, previous);
  return { raw: delta.raw, formatted: formatDeltaPoints(delta.raw) };
}

/** The same points delta as a bare table cell rather than a card chip. */
function PointsChange({ current, previous }: { current: number | null; previous: number | null }) {
  if (current === null || previous === null) return <span className="text-ink-400">—</span>;

  const delta = computeDelta(current, previous);
  return (
    <span
      className={clsx(
        'tnum font-semibold',
        delta.direction === 'up' && 'text-success-700',
        delta.direction === 'down' && 'text-danger-700',
        delta.direction === 'flat' && 'text-ink-500',
      )}
    >
      {formatDeltaPoints(delta.raw)}
    </span>
  );
}

/**
 * The fetch failed. Stated where the cards would be rather than as an empty
 * state: nothing is missing from the data, the request is.
 */
function LoadError() {
  return (
    <div
      role="status"
      className="flex items-start gap-2.5 rounded-panel border border-danger-100 bg-danger-50 px-4 py-3"
    >
      <TriangleAlert
        aria-hidden="true"
        size={16}
        strokeWidth={2}
        className="mt-px shrink-0 text-danger-700"
      />
      <p className="text-data text-danger-700">
        <span className="font-semibold">The funnel</span> could not be loaded for this
        period. Refresh to try again.
      </p>
    </div>
  );
}
